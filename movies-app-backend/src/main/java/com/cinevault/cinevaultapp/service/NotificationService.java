package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.NotificationActorDto;
import com.cinevault.cinevaultapp.dto.NotificationDto;
import com.cinevault.cinevaultapp.entity.NotificationEntity;
import com.cinevault.cinevaultapp.entity.ReviewEntity;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.enums.NotificationTypeEnum;
import com.cinevault.cinevaultapp.repository.INotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service class for managing in-app notifications for authenticated users.
 * Handles notification retrieval, unread state updates, and creation of
 * follow, review reply, and review like notifications.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Service
@Transactional
public class NotificationService {

    @Autowired
    private INotificationRepository notificationRepository;

    @Autowired
    private AuthServices authServices;

    /**
     * Returns notifications for the signed-in user, newest first.
     *
     * @param username - Username whose notifications should be loaded.
     * @return - List of notification DTOs ordered from newest to oldest.
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications(String username) {
        UserEntity recipient = authServices.getUser(username);
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Returns the unread count used by the navbar badge.
     *
     * @param username - Username whose unread count should be calculated.
     * @return - Number of unread notifications for the user.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        UserEntity recipient = authServices.getUser(username);
        return notificationRepository.countByRecipientAndReadStatusFalse(recipient);
    }

    /**
     * Marks a single notification as read for its owner.
     *
     * @param notificationId - Identifier of the notification to update.
     * @param username - Username of the authenticated user.
     */
    public void markAsRead(Long notificationId, String username) {
        NotificationEntity notification = getOwnedNotification(notificationId, username);
        if (!notification.isReadStatus()) {
            // Skip the save when the notification was already read to keep the write path small.
            notification.setReadStatus(true);
            notificationRepository.save(notification);
        }
    }

    /**
     * Marks every notification as read for the current user.
     *
     * @param username - Username of the authenticated user.
     */
    public void markAllAsRead(String username) {
        UserEntity recipient = authServices.getUser(username);
        List<NotificationEntity> unreadNotifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient)
                .stream()
                .filter(notification -> !notification.isReadStatus())
                .toList();
        if (unreadNotifications.isEmpty()) {
            return;
        }

        // Only touch unread rows so we avoid unnecessary update statements on already-read notifications.
        unreadNotifications.forEach(notification -> notification.setReadStatus(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    /**
     * Creates a follow notification for the target user.
     *
     * @param actor - User who initiated the follow action.
     * @param recipient - User who should receive the notification.
     */
    public void notifyFollow(UserEntity actor, UserEntity recipient) {
        if (actor == null || recipient == null || actor.getId().equals(recipient.getId())) {
            return;
        }

        createNotification(
                NotificationTypeEnum.FOLLOW,
                actor,
                recipient,
                actor.getFullName() + " started following you.",
                null,
                null,
                null
        );
    }

    /**
     * Creates a review reply notification for the parent review owner.
     *
     * @param actor - User who wrote the reply.
     * @param parentReview - Original review being replied to.
     * @param replyReview - Newly created reply review.
     */
    public void notifyReviewReply(UserEntity actor, ReviewEntity parentReview, ReviewEntity replyReview) {
        if (actor == null || parentReview == null || replyReview == null) {
            return;
        }

        UserEntity recipient = parentReview.getUserEntity();
        if (recipient == null || actor.getId().equals(recipient.getId())) {
            return;
        }

        createNotification(
                NotificationTypeEnum.REVIEW_REPLY,
                actor,
                recipient,
                actor.getFullName() + " replied to your review.",
                replyReview.getMediaId(),
                replyReview.getMediaType(),
                replyReview.getId()
        );
    }

    /**
     * Creates a like notification for the review owner when someone likes their review.
     *
     * @param actor - User who liked the review.
     * @param likedReview - Review that received the like.
     */
    public void notifyReviewLike(UserEntity actor, ReviewEntity likedReview) {
        if (actor == null || likedReview == null || likedReview.getUserEntity() == null) {
            return;
        }

        UserEntity recipient = likedReview.getUserEntity();
        if (actor.getId().equals(recipient.getId())) {
            return;
        }

        createNotification(
                NotificationTypeEnum.REVIEW_LIKE,
                actor,
                recipient,
                actor.getFullName() + " liked your review.",
                likedReview.getMediaId(),
                likedReview.getMediaType(),
                likedReview.getId()
        );
    }

    /**
     * Loads a notification and verifies that it belongs to the caller before mutating it.
     *
     * @param notificationId - Identifier of the notification being changed.
     * @param username - Username of the authenticated user.
     * @return - The owned {@link NotificationEntity} ready for updates.
     * @throws IllegalArgumentException - If the identifier is missing or invalid.
     * @throws RuntimeException - If the notification cannot be found.
     * @throws AccessDeniedException - If the notification belongs to a different user.
     */
    private NotificationEntity getOwnedNotification(Long notificationId, String username) {
        if (notificationId == null || notificationId <= 0) {
            throw new IllegalArgumentException("Notification id must be a positive number");
        }

        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getUserName().equals(username)) {
            throw new AccessDeniedException("You can only modify your own notifications");
        }
        return notification;
    }

    /**
     * Creates and persists a notification row using the supplied event metadata.
     *
     * @param type - Notification category to store.
     * @param actor - User who triggered the notification.
     * @param recipient - User who should receive the notification.
     * @param message - Human-readable notification message for the UI.
     * @param mediaId - Related movie or show id when the event targets media content.
     * @param mediaType - Media type string paired with the media id.
     * @param reviewId - Related review id when the event points back to a review thread.
     */
    private void createNotification(NotificationTypeEnum type,
                                    UserEntity actor,
                                    UserEntity recipient,
                                    String message,
                                    Long mediaId,
                                    String mediaType,
                                    Long reviewId) {
        NotificationEntity notification = new NotificationEntity();
        notification.setType(type);
        notification.setActor(actor);
        notification.setRecipient(recipient);
        notification.setMessage(message);
        notification.setMediaId(mediaId);
        notification.setMediaType(mediaType);
        notification.setReviewId(reviewId);
        notificationRepository.save(notification);
    }

    /**
     * Maps a stored notification entity into the response shape used by the frontend.
     *
     * @param entity - Stored notification entity.
     * @return - Mapped {@link NotificationDto} for API responses.
     */
    private NotificationDto toDto(NotificationEntity entity) {
        NotificationDto dto = new NotificationDto();
        dto.setId(entity.getId());
        dto.setType(entity.getType().name());
        dto.setMessage(entity.getMessage());
        dto.setRead(entity.isReadStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setMediaId(entity.getMediaId());
        dto.setMediaType(entity.getMediaType());
        dto.setReviewId(entity.getReviewId());
        dto.setActor(toActorDto(entity.getActor()));
        return dto;
    }

    /**
     * Converts the notification actor into a compact profile summary for the client.
     *
     * @param actor - User who triggered the notification.
     * @return - Lightweight actor DTO, or {@code null} when no actor is available.
     */
    private NotificationActorDto toActorDto(UserEntity actor) {
        if (actor == null) {
            return null;
        }

        NotificationActorDto dto = new NotificationActorDto();
        dto.setUsername(actor.getUserName());
        dto.setFullName(actor.getFullName());
        dto.setAvatarUrl(actor.getAvatarUrl());
        return dto;
    }
}
