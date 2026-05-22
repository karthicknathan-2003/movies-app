package com.cinevault.cinevaultapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Data Transfer Object for a single episode entry from the Jikan (MAL) API.
 *
 * @author karthicknathan
 * @since Apr 05, 2026
 * @version 1.0
 */
@Data
public class JikanEpisodeDto {

    /** Episode number on MAL. */
    @JsonProperty("mal_id")
    private Integer malId;

    /** Episode title. */
    private String title;

    /** Air date of the episode. */
    private String aired;

    /** Episode score on MAL (0.0 if unrated). */
    private Double score;
}