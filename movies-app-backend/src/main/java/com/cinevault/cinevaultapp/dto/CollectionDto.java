package com.cinevault.cinevaultapp.dto;

import lombok.Data;
import java.util.List;

/**
 * Data Transfer Object for movie collection/franchise information from TMDB API.
 * A collection groups related movies together (e.g., "Star Wars Collection").
 *
 * @author karthicknathan
 * @since Mar 20, 2026
 *
 * @version 1.0
 */
@Data
public class CollectionDto {
    /** The unique identifier of the collection. */
    private Long id;

    /** The name of the collection/franchise. */
    private String name;

    /** A brief overview of the collection. */
    private String overview;

    /** The path to the collection's poster image. */
    private String poster_path;

    /** The path to the collection's backdrop image. */
    private String backdrop_path;

    private Double popularity;

    /** All movies that belong to this collection, ordered by release date. */
    private List<MovieDto> parts;
}