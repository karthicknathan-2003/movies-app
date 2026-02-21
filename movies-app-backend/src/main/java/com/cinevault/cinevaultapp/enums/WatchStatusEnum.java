package com.cinevault.cinevaultapp.enums;

/**
 * Enum representing the watch status of a media item in a user's watchlist.
 * Tracks the viewing progress of movies and TV shows.
 *
 * @author karthicknathan
 * @since Feb 07, 2026
 *
 * @version 1.0
 */
public enum WatchStatusEnum {
    /**
     * Indicates the media is planned to be watched but not yet started.
     */
    PLANNED,

    /**
     * Indicates the media is currently being watched.
     */
    IN_PROGRESS,

    /**
     * Indicates the media has been fully watched.
     */
    COMPLETED,

    /**
     * Indicates the media was started but discontinued.
     */
    DROPPED
}