package com.cinevault.cinevaultapp.repository;

import com.cinevault.cinevaultapp.entity.NotificationEntity;
import com.cinevault.cinevaultapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository interface for managing {@link NotificationEntity} persistence operations.
 * Provides query methods for reading notification inbox entries and unread
 * counts for a specific recipient.
 *
 * @author karthicknathan
 * @since May 28, 2026
 *
 * @version 1.0
 */
public interface INotificationRepository extends JpaRepository<NotificationEntity, Long> {

    /**
     * Retrieves all notifications for a recipient ordered from newest to oldest.
     *
     * @param recipient - User who owns the notification inbox.
     *
     * @return - List of {@link NotificationEntity} rows for the recipient.
     */
    List<NotificationEntity> findByRecipientOrderByCreatedAtDesc(UserEntity recipient);

    /**
     * Counts only unread notifications for a recipient.
     *
     * @param recipient - User whose unread notifications should be counted.
     *
     * @return - Total unread notification count for the recipient.
     */
    long countByRecipientAndReadStatusFalse(UserEntity recipient);
}
