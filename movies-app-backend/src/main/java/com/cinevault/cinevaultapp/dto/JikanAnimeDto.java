package com.cinevault.cinevaultapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Data Transfer Object for a single anime entry from the Jikan (MAL) API.
 *
 * @author karthicknathan
 * @since Apr 05, 2026
 * @version 1.0
 */
@Data
public class JikanAnimeDto {

    /** MAL ID of the anime. */
    @JsonProperty("mal_id")
    private Long malId;

    /** Title of the anime. */
    private String title;

    /** Number of episodes in this MAL entry. */
    private Integer episodes;

    /** Airing status (e.g. "Finished Airing"). */
    private String status;

    /** The season this entry aired (e.g. "spring"). */
    private String season;

    /** The year this entry aired. */
    private Integer year;
}