package com.cinevault.cinevaultapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for a watchlist group.
 * Carries the group ID, display name, and item count back to the client.
 *
 * @author karthicknathan
 * @since Mar 20, 2026
 *
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistGroupDto {

    /**
     * The unique identifier of the watchlist group.
     */
    private Long id;

    /**
     * The display name of the watchlist group.
     */
    private String name;

    /**
     * The number of items currently in this group.
     */
    private int itemCount;
}