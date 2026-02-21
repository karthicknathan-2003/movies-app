package com.cinevault.cinevaultapp.dto;

import lombok.Data;
import java.util.List;

/**
 * Generic Data Transfer Object for paginated responses from TMDB API.
 * Can be used with any type of result (movies, TV shows, people, etc.).
 *
 * @param <T> - The type of items in the results list.
 *
 * @author karthicknathan
 * @since Feb 06, 2026
 *
 * @version 1.0
 */
@Data
public class PagedResponseDto<T> {
    /**
     * The current page number.
     */
    private int page;

    /**
     * List of items in the current page.
     */
    private List<T> results;

    /**
     * The total number of pages available.
     */
    private int total_pages;

    /**
     * The total number of results across all pages.
     */
    private int total_results;
}