package com.cinevault.cinevaultapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for per-episode watch progress.
 * Used to read and update watched episode markers for episodic titles such as
 * TV series and anime, including timing and watch-state information.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EpisodeProgressDto {
    /** One-based season number of the episode. */
    private Integer seasonNumber;
    /** One-based episode number within the season. */
    private Integer episodeNumber;
    /** Episode title shown in the progress UI. */
    private String episodeName;
    /** Runtime in minutes when it is known. */
    private Integer runtimeMinutes;
    /** Whether the episode is currently marked as watched. */
    private Boolean watched;
    /** Timestamp when the episode was marked as watched. */
    private LocalDateTime watchedAt;
}
