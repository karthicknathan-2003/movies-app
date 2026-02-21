package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.WatchListDto;
import com.cinevault.cinevaultapp.dto.WatchlistStatusDto;
import com.cinevault.cinevaultapp.enums.WatchStatusEnum;
import com.cinevault.cinevaultapp.service.WatchListServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST controller for managing user watchlist operations.
 * Provides endpoints for adding, retrieving, updating, and removing watchlist items.
 * All endpoints require authentication.
 *
 * @author karthicknathan
 * @since Feb 06, 2026
 *
 * @version 1.0
 */
@RestController
@RequestMapping("/api/watchlist")
@CrossOrigin(origins = "*")
public class WatchListController {

    @Autowired
    private WatchListServices watchListServices;

    /**
     * Adds a movie or TV show to the authenticated user's watchlist.
     *
     * @param dto - The {@code WatchListDto} containing the media item details to add.
     * @param authentication - The {@code Authentication} object containing user credentials.
     */
    @PostMapping
    public void addToWatchList(@RequestBody WatchListDto dto,
            Authentication authentication) {
        watchListServices.saveToWatchList(authentication.getName(), dto);
    }

    /**
     * Retrieves the complete watchlist for the authenticated user.
     * Includes detailed media information from TMDB.
     *
     * @param authentication - The {@code Authentication} object containing user credentials.
     *
     * @return - A list of {@code WatchListDto} objects with complete media details.
     */
    @GetMapping
    public List<WatchListDto> getWatchList(Authentication authentication) {
        return watchListServices.getWatchListWithDetails(authentication.getName());
    }

    /**
     * Removes a specific movie or TV show from the authenticated user's watchlist.
     *
     * @param movieId - The unique identifier of the movie/show to remove.
     * @param authentication - The {@code Authentication} object containing user credentials.
     */
    @DeleteMapping("/{movieId}")
    public void remove(@PathVariable Long movieId,
            Authentication authentication) {
        watchListServices.removeFromWatchList(authentication.getName(), movieId);
    }

    /**
     * Retrieves a specific watchlist item by movie ID.
     *
     * @param userName - The username of the authenticated user.
     * @param movieId - The unique identifier of the movie/show to retrieve.
     *
     * @return - A {@code ResponseEntity} containing the {@code WatchListDto} if found, or 404 if not found.
     */
    @GetMapping("/{movieId}")
    public ResponseEntity<WatchListDto> getWatchListItem(
            @AuthenticationPrincipal String userName, @PathVariable Long movieId) {
        return watchListServices
                .getWatchListItem(userName, movieId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Retrieves the watchlist status for a specific movie or TV show.
     * Indicates whether the item is in the watchlist and if it's marked as favorite.
     *
     * @param userName - The username of the authenticated user.
     * @param movieId - The unique identifier of the movie/show to check.
     *
     * @return - A {@code WatchlistStatusDto} containing the status information.
     */
    @GetMapping("/{movieId}/status")
    public WatchlistStatusDto getStatus(
            @AuthenticationPrincipal String userName, @PathVariable Long movieId) {
        return watchListServices.getWatchlistStatus(userName, movieId);
    }

    /**
     * Updates the watch status of a movie or TV show in the user's watchlist.
     *
     * @param movieId - The unique identifier of the movie/show to update.
     * @param status - The new {@code WatchStatusEnum} to set.
     * @param principal - The {@code Principal} object containing user information.
     */
    @PatchMapping("/{movieId}/status")
    public void updateStatus(@PathVariable Long movieId,
            @RequestParam WatchStatusEnum status, Principal principal) {
        watchListServices.updateStatus(principal.getName(), movieId, status);
    }
}