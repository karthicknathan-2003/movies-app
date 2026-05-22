package com.cinevault.cinevaultapp.dto;

import lombok.Data;

import java.util.List;

/**
 * Data Transfer Object for TV show details from TMDB API.
 * Contains basic TV series information and associated seasons.
 *
 * @author karthicknathan
 * @since Feb 07, 2026
 *
 * @version 1.0
 */
@Data
public class TvDetailsDto {
    /**
     * The unique identifier of the TV series.
     */
    private Long id;

    /**
     * The title of the TV series.
     */
    private String name;

    /**
     * A brief overview or synopsis of the TV series.
     */
    private String overview;

    /**
     * The path to the series' poster image.
     */
    private String poster_path;

    /**
     * The path to the series' backdrop image.
     */
    private String backdrop_path;

    /**
     * The date the first episode aired.
     */
    private String first_air_date;

    /**
     * The average user rating of the series.
     */
    private Double vote_average;

    /**
     * List of seasons in the TV series.
     */
    private List<SeasonDto> seasons;

    private int number_of_seasons;

    private int number_of_episodes;
}