package com.cinevault.cinevaultapp.dto;

import lombok.Data;

import java.util.List;

/**
 * Data Transfer Object for TV show season information from TMDB API.
 * Contains details about a specific season including its episodes.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Data
public class SeasonDto {
    /**
     * The season number.
     */
    private int season_number;

    /**
     * The name of the season (e.g., "Season 1" or a custom name).
     */
    private String name;

    /**
     * The air date of the season's first episode.
     */
    private String air_date;

    /**
     * The path to the season's poster image.
     */
    private String poster_path;

    /**
     * The average user rating across all episodes in the season.
     */
    private Double vote_average;

    /**
     * List of episodes in the season.
     */
    private List<EpisodeDto> episodes;
}