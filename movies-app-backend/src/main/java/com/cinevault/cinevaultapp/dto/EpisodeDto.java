package com.cinevault.cinevaultapp.dto;

import lombok.Data;

/**
 * Data Transfer Object for TV show episode information from TMDB API.
 * Contains details about a single episode within a season.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Data
public class EpisodeDto {
    /**
     * The episode number within the season.
     */
    private int episode_number;

    /**
     * The title of the episode.
     */
    private String name;

    /**
     * A brief overview or synopsis of the episode.
     */
    private String overview;

    /**
     * The air date of the episode.
     */
    private String air_date;

    /**
     * The path to the episode's still image.
     */
    private String still_path;

    /**
     * The average user rating of the episode.
     */
    private Double vote_average;
}