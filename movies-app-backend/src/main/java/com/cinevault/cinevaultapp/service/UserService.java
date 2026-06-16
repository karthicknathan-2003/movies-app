package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.UserProfileDto;
import com.cinevault.cinevaultapp.dto.UserActivityDto;
import com.cinevault.cinevaultapp.dto.UserStatsDto;
import com.cinevault.cinevaultapp.dto.MovieDto;
import com.cinevault.cinevaultapp.entity.ReviewEntity;
import com.cinevault.cinevaultapp.entity.EpisodeProgressEntity;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.entity.WatchListEntity;
import com.cinevault.cinevaultapp.enums.MediaTypeEnum;
import com.cinevault.cinevaultapp.enums.WatchStatusEnum;
import com.cinevault.cinevaultapp.repository.IEpisodeProgressRepository;
import com.cinevault.cinevaultapp.repository.IReviewRepository;
import com.cinevault.cinevaultapp.repository.IUserRepository;
import com.cinevault.cinevaultapp.repository.IWatchListRepository;
import com.cinevault.cinevaultapp.repository.IWatchlistGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Comparator;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Service class for handling user-related operations.
 * Provides methods for user retrieval, following/unfollowing, and user
 * statistics.
 *
 * @author karthicknathan
 * @since Mar 03, 2026
 *
 * @version 1.0
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IWatchlistGroupRepository  watchlistGroupRepository;

    @Autowired
    private IWatchListRepository watchListRepository;

    @Autowired
    private IEpisodeProgressRepository episodeProgressRepository;

    @Autowired
    private IReviewRepository reviewRepository;

    @Autowired
    private TmdbServices tmdbServices;

    @Autowired
    private NotificationService notificationService;

    /**
     * Get all users except the current authenticated user.
     *
     * @param currentUsername - The username of the current authenticated user.
     * @return - List of UserProfileDto for all other users.
     */
    public List<UserProfileDto> getAllUsers(String currentUsername) {
        UserEntity currentUser = userRepository.findByUserName(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        List<UserEntity> allUsers = userRepository.findByUserNameNot(currentUsername);

        return allUsers.stream()
                .map(user -> UserProfileDto.fromEntity(user, currentUser))
                .collect(Collectors.toList());
    }

    /**
     * Update the stored profile details for a user.
     *
     * @param username - The username of the profile owner.
     * @param dto      - The new profile values to persist.
     * @return - The saved profile mapped as {@code UserProfileDto}.
     */
    @Transactional
    public UserProfileDto updateProfile(String username,
                                        UserProfileDto dto) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setBio(dto.getBio());
        user.setLocation(dto.getLocation());
        user.setAvatarUrl(dto.getAvatarUrl());
        user.setInterests(dto.getInterests());

        return UserProfileDto.fromEntity(userRepository.save(user));
    }

    /**
     * Get a user by username.
     *
     * @param username        - The username to retrieve.
     * @param currentUsername - The username of the current authenticated user (for
     *                        isFollowing check).
     * @return - UserProfileDto for the specified user.
     */
    public UserProfileDto getUserByUsername(String username, String currentUsername) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserEntity currentUser = null;
        if (currentUsername != null && !currentUsername.equals(username)) {
            currentUser = userRepository.findByUserName(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));
        }

        return UserProfileDto.fromEntity(user, currentUser);
    }

    /**
     * Get statistics for a user.
     *
     * @param username - The username to get stats for.
     * @return - UserStatsDto containing follower and following counts.
     */
    public UserStatsDto getUserStats(String username) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int followers = user.getFollowers() != null ? user.getFollowers().size() : 0;
        int following = user.getFollowing() != null ? user.getFollowing().size() : 0;
        int watchlistGroupCount = watchlistGroupRepository.getGroupCountByUserId(user.getId());
        Map<Long, WatchListEntity> uniqueWatchlistItems = watchListRepository.findByUserEntity(user)
                .stream()
                // Keep the first saved record for each media item so grouped duplicates do not inflate profile stats.
                .collect(Collectors.toMap(
                        WatchListEntity::getMovieId,
                        item -> item,
                        (existing, ignored) -> existing,
                        LinkedHashMap::new
                ));
        Map<Long, List<EpisodeProgressEntity>> episodeProgressByMedia = episodeProgressRepository.findByUserEntity(user)
                .stream()
                .collect(Collectors.groupingBy(EpisodeProgressEntity::getMovieId));

        int plannedCount = 0;
        int inProgressCount = 0;
        int completedCount = 0;
        int droppedCount = 0;
        int totalWatchMinutes = 0;
        int watchedEpisodeCount = 0;

        for (WatchListEntity item : uniqueWatchlistItems.values()) {
            switch (item.getWatchStatus()) {
                case PLANNED -> plannedCount++;
                case IN_PROGRESS -> inProgressCount++;
                case COMPLETED -> completedCount++;
                case DROPPED -> droppedCount++;
            }

            try {
                MovieDto media = tmdbServices.getMediaDetails(
                        MediaTypeEnum.valueOf(item.getMediaType().toUpperCase()),
                        item.getMovieId()
                );

                if ("movie".equalsIgnoreCase(item.getMediaType())) {
                    totalWatchMinutes += estimateMovieMinutes(media, item.getWatchStatus());
                    continue;
                }

                List<EpisodeProgressEntity> watchedEpisodes = episodeProgressByMedia
                        .getOrDefault(item.getMovieId(), List.of());
                int averageEpisodeRuntime = resolveAverageEpisodeRuntime(media);
                int explicitEpisodeMinutes = watchedEpisodes.stream()
                        // Older rows may have 0 captured minutes from before runtime fallback data was available.
                        .mapToInt(ep -> ep.getRuntimeMinutes() != null && ep.getRuntimeMinutes() > 0
                                ? ep.getRuntimeMinutes()
                                : averageEpisodeRuntime)
                        .sum();

                if (!watchedEpisodes.isEmpty()) {
                    totalWatchMinutes += explicitEpisodeMinutes;
                    watchedEpisodeCount += watchedEpisodes.size();
                    continue;
                }

                int fallbackEpisodeCount = estimateEpisodeCount(media, item.getWatchStatus());
                watchedEpisodeCount += fallbackEpisodeCount;
                totalWatchMinutes += fallbackEpisodeCount * averageEpisodeRuntime;
            } catch (Exception ignored) {
                // Stats remain useful even if one TMDB lookup fails.
            }
        }

        UserStatsDto stats = new UserStatsDto();
        stats.setFollowers(followers);
        stats.setFollowing(following);
        stats.setWatchlistGroupCount(watchlistGroupCount);
        stats.setPlannedCount(plannedCount);
        stats.setInProgressCount(inProgressCount);
        stats.setCompletedCount(completedCount);
        stats.setDroppedCount(droppedCount);
        stats.setTotalWatchMinutes(totalWatchMinutes);
        stats.setWatchedEpisodeCount(watchedEpisodeCount);
        stats.setTrackedMediaCount(uniqueWatchlistItems.size());
        return stats;
    }

    /**
     * Estimates how many episodes were probably watched when no explicit progress rows exist.
     *
     * @param media - TMDB media details containing episode totals.
     * @param status - Saved watch status for the show.
     * @return - Estimated watched episode count used for profile stats.
     */
    private int estimateEpisodeCount(MovieDto media, WatchStatusEnum status) {
        int totalEpisodes = media.getNumber_of_episodes() != null ? media.getNumber_of_episodes() : 0;
        return switch (status) {
            case COMPLETED -> totalEpisodes;
            case IN_PROGRESS -> Math.max(1, totalEpisodes / 4);
            case DROPPED -> Math.max(0, totalEpisodes / 8);
            case PLANNED -> 0;
        };
    }

    /**
     * Creates stable activity rows from one watchlist item.
     * We always include the add event and conditionally include a rating event.
     *
     * @param item - De-duplicated watchlist entry.
     * @return - One or two profile activity rows for the entry.
     */
    private List<UserActivityDto> buildWatchlistActivities(WatchListEntity item) {
        List<UserActivityDto> activities = new java.util.ArrayList<>();
        activities.add(new UserActivityDto(
                "watchlist-added-" + item.getMovieId(),
                "ADDED_TO_WATCHLIST",
                item.getMovieTitle(),
                item.getMovieId(),
                item.getMediaType(),
                null,
                null,
                item.getCreatedAt() != null ? item.getCreatedAt() : resolveActivityTimestamp(item)
        ));

        if (item.getPersonalRating() != null) {
            activities.add(new UserActivityDto(
                    "watchlist-rated-" + item.getMovieId(),
                    "RATED_TITLE",
                    item.getMovieTitle(),
                    item.getMovieId(),
                item.getMediaType(),
                item.getPersonalRating(),
                null,
                resolveActivityTimestamp(item)
            ));
        }

        return activities;
    }

    /**
     * Maps a stored review or reply into the profile activity feed format.
     *
     * @param review - Authored review entity.
     * @return - Compact activity row for the frontend.
     */
    private UserActivityDto toReviewActivity(ReviewEntity review) {
        boolean isReply = review.getParentReview() != null;
        return new UserActivityDto(
                "review-" + review.getId(),
                isReply ? "REPLIED_TO_REVIEW" : "ADDED_REVIEW",
                resolveMediaTitle(review.getMediaType(), review.getMediaId()),
                review.getMediaId(),
                review.getMediaType(),
                review.getRating(),
                buildPreview(review.getContent()),
                review.getCreatedAt()
        );
    }

    /**
     * Shortens long review text so the profile activity feed stays compact on mobile.
     *
     * @param content - Raw review or reply body.
     * @return - Short readable preview for the activity list.
     */
    private String buildPreview(String content) {
        if (content == null) {
            return "";
        }
        String trimmed = content.trim();
        if (trimmed.length() <= 120) {
            return trimmed;
        }
        return trimmed.substring(0, 117) + "...";
    }

    /**
     * Handles older watchlist rows that may not have both timestamps populated yet.
     *
     * @param item - Watchlist row being mapped into profile activity.
     * @return - Best available timestamp for sorting and display.
     */
    private LocalDateTime resolveActivityTimestamp(WatchListEntity item) {
        if (item.getUpdatedAt() != null) {
            return item.getUpdatedAt();
        }
        if (item.getCreatedAt() != null) {
            return item.getCreatedAt();
        }
        return LocalDateTime.MIN;
    }

    /**
     * Resolves a display title for review activity rows using the existing TMDB service.
     * Falls back to a generic label if the lookup fails so the feed remains stable.
     *
     * @param mediaType - Stored review media type.
     * @param mediaId - Reviewed title identifier.
     * @return - Best available title for the reviewed media item.
     */
    private String resolveMediaTitle(String mediaType, Long mediaId) {
        try {
            MediaTypeEnum mediaTypeEnum = "movie".equalsIgnoreCase(mediaType)
                    ? MediaTypeEnum.MOVIE
                    : MediaTypeEnum.TV;
            MovieDto media = tmdbServices.getMediaDetails(mediaTypeEnum, mediaId);
            return media.getTitle() != null && !media.getTitle().isBlank()
                    ? media.getTitle()
                    : media.getName();
        } catch (Exception ignored) {
            return "this title";
        }
    }

    /**
     * Get followers of a user.
     *
     * @param username        - The username to get followers for.
     * @param currentUsername - The username of the current authenticated user.
     * @return - List of UserProfileDto for the user's followers.
     */
    public List<UserProfileDto> getFollowers(String username, String currentUsername) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserEntity currentUser = null;
        if (currentUsername != null) {
            currentUser = userRepository.findByUserName(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));
        }

        Set<UserEntity> followers = user.getFollowers();
        if (followers == null || followers.isEmpty()) {
            return List.of();
        }

        final UserEntity finalCurrentUser = currentUser;
        return followers.stream()
                .map(follower -> UserProfileDto.fromEntity(follower, finalCurrentUser))
                .collect(Collectors.toList());
    }

    /**
     * Get the users that a user is following.
     *
     * @param username        - The username to get following list for.
     * @param currentUsername - The username of the current authenticated user.
     * @return - List of UserProfileDto for users being followed.
     */
    public List<UserProfileDto> getFollowing(String username, String currentUsername) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserEntity currentUser = null;
        if (currentUsername != null) {
            currentUser = userRepository.findByUserName(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));
        }

        Set<UserEntity> following = user.getFollowing();
        if (following == null || following.isEmpty()) {
            return List.of();
        }

        final UserEntity finalCurrentUser = currentUser;
        return following.stream()
                .map(followedUser -> UserProfileDto.fromEntity(followedUser, finalCurrentUser))
                .collect(Collectors.toList());
    }

    /**
     * Follow a user.
     *
     * @param currentUsername  - The username of the current authenticated user.
     * @param usernameToFollow - The username of the user to follow.
     */
    public void followUser(String currentUsername, String usernameToFollow) {
        if (currentUsername.equals(usernameToFollow)) {
            throw new RuntimeException("Cannot follow yourself");
        }

        UserEntity currentUser = userRepository.findByUserName(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        UserEntity userToFollow = userRepository.findByUserName(usernameToFollow)
                .orElseThrow(() -> new RuntimeException("User to follow not found"));

        if (!currentUser.getFollowing().contains(userToFollow)) {
            currentUser.getFollowing().add(userToFollow);
            userRepository.save(currentUser);
            notificationService.notifyFollow(currentUser, userToFollow);
        }
    }

    /**
     * Unfollow a user.
     *
     * @param currentUsername    - The username of the current authenticated user.
     * @param usernameToUnfollow - The username of the user to unfollow.
     */
    public void unfollowUser(String currentUsername, String usernameToUnfollow) {
        UserEntity currentUser = userRepository.findByUserName(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        UserEntity userToUnfollow = userRepository.findByUserName(usernameToUnfollow)
                .orElseThrow(() -> new RuntimeException("User to unfollow not found"));

        if (currentUser.getFollowing().contains(userToUnfollow)) {
            currentUser.getFollowing().remove(userToUnfollow);
            userRepository.save(currentUser);
        }
    }

    /**
     * Builds a compact activity feed for the signed-in user's profile page.
     * The feed includes newly added titles, saved ratings, and authored reviews/replies.
     *
     * @param username - The signed-in user's username.
     * @return - Reverse-chronological activity rows for the profile feed.
     */
    @Transactional(readOnly = true)
    public List<UserActivityDto> getMyActivity(String username) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<Long, WatchListEntity> uniqueWatchlistItems = watchListRepository.findByUserEntity(user)
                .stream()
                // Group duplicates by media id so grouped copies do not create repeated activity rows.
                .collect(Collectors.toMap(
                        WatchListEntity::getMovieId,
                        item -> item,
                        (left, right) -> {
                            if (resolveActivityTimestamp(right).isAfter(resolveActivityTimestamp(left))) {
                                return right;
                            }
                            return left;
                        },
                        LinkedHashMap::new
                ));

        List<UserActivityDto> watchlistActivities = uniqueWatchlistItems.values()
                .stream()
                .flatMap(item -> buildWatchlistActivities(item).stream())
                .toList();

        List<UserActivityDto> reviewActivities = reviewRepository.findByUserEntityOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toReviewActivity)
                .toList();

        return java.util.stream.Stream.concat(watchlistActivities.stream(), reviewActivities.stream())
                .sorted(Comparator.comparing(UserActivityDto::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(20)
                .toList();
    }

    /**
     * Estimates watched minutes for a movie based on the user's watch status.
     *
     * @param media - TMDB media details containing runtime data.
     * @param status - Watch status stored for the title.
     * @return - Estimated watched minutes contributed by the movie.
     */
    private int estimateMovieMinutes(MovieDto media, WatchStatusEnum status) {
        int runtime = media.getRuntime() != null ? media.getRuntime() : 0;
        return switch (status) {
            case COMPLETED -> runtime;
            case IN_PROGRESS -> Math.max(runtime / 2, 0);
            case DROPPED -> Math.max(runtime / 4, 0);
            case PLANNED -> 0;
        };
    }

    /**
     * Resolves a reasonable per-episode runtime for progress calculations.
     *
     * @param media - TMDB media details for the show.
     * @return - Average episode runtime, or the title runtime fallback when episode values are missing.
     */
    private int resolveAverageEpisodeRuntime(MovieDto media) {
        if (media.getEpisode_run_time() != null && !media.getEpisode_run_time().isEmpty()) {
            return (int) Math.round(
                    media.getEpisode_run_time().stream().mapToInt(Integer::intValue).average().orElse(0)
            );
        }
        return media.getRuntime() != null ? media.getRuntime() : 0;
    }
}
