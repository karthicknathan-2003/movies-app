package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.WatchListDto;
import com.cinevault.cinevaultapp.dto.WatchlistGroupDto;
import com.cinevault.cinevaultapp.service.WatchlistGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for managing named watchlist groups.
 * Provides endpoints for creating groups, listing groups,
 * deleting groups, and managing items within each group.
 * All endpoints require authentication.
 *
 * @author karthicknathan
 * @since Mar 2026
 *
 * @version 1.0
 */
@RestController
@RequestMapping("/api/watchlist/groups")
public class WatchlistGroupController {

    @Autowired
    private WatchlistGroupService groupService;

    /**
     * Creates a new named watchlist group for the authenticated user.
     *
     * POST /api/watchlist/groups
     * Body: { "name": "My Anime List" }
     *
     * @param body           - Request body containing the group {@code name} field.
     * @param authentication - The authenticated user.
     *
     * @return - The created {@link WatchlistGroupDto}.
     */
    @PostMapping
    public ResponseEntity<WatchlistGroupDto> createGroup(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        WatchlistGroupDto created = groupService.createGroup(authentication.getName(), name);
        return ResponseEntity.ok(created);
    }

    /**
     * Retrieves all watchlist groups for the authenticated user.
     *
     * GET /api/watchlist/groups
     *
     * @param authentication - The authenticated user.
     *
     * @return - List of {@link WatchlistGroupDto} objects.
     */
    @GetMapping
    public List<WatchlistGroupDto> getGroups(Authentication authentication) {
        return groupService.getGroups(authentication.getName());
    }

    /**
     * Deletes a watchlist group and all its items.
     *
     * DELETE /api/watchlist/groups/{groupId}
     *
     * @param groupId        - The ID of the group to delete.
     * @param authentication - The authenticated user.
     *
     * @return - 204 No Content on success.
     */
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long groupId,
            Authentication authentication) {

        groupService.deleteGroup(authentication.getName(), groupId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Adds a media item to a specific watchlist group.
     *
     * POST /api/watchlist/groups/{groupId}/items
     *
     * @param groupId        - The target group ID.
     * @param dto            - The {@link WatchListDto} containing item details.
     * @param authentication - The authenticated user.
     *
     * @return - 200 OK on success.
     */
    @PostMapping("/{groupId}/items")
    public ResponseEntity<Void> addItem(
            @PathVariable Long groupId,
            @RequestBody WatchListDto dto,
            Authentication authentication) {

        groupService.addItemToGroup(authentication.getName(), groupId, dto);
        return ResponseEntity.ok().build();
    }

    /**
     * Retrieves all items inside a specific watchlist group with enriched TMDB details.
     *
     * GET /api/watchlist/groups/{groupId}/items
     *
     * @param groupId        - The ID of the group to retrieve items from.
     * @param authentication - The authenticated user.
     *
     * @return - List of {@link WatchListDto} with full media details.
     */
    @GetMapping("/{groupId}/items")
    public List<WatchListDto> getGroupItems(
            @PathVariable Long groupId,
            Authentication authentication) {

        return groupService.getGroupItems(authentication.getName(), groupId);
    }

    /**
     * Retrieves all watchlist groups for the given user name.
     *
     * @param userName - The user name whose groups should be returned.
     * @return - List of watchlist groups owned by the user.
     */
    @GetMapping("user/{userName}")
    public List<WatchlistGroupDto> getGroupById(@PathVariable String userName) {
        return groupService.getGroups(userName);
    }
}
