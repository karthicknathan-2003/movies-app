package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.WatchListDto;
import com.cinevault.cinevaultapp.dto.WatchlistGroupDto;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.entity.WatchListEntity;
import com.cinevault.cinevaultapp.entity.WatchlistGroupEntity;
import com.cinevault.cinevaultapp.enums.MediaTypeEnum;
import com.cinevault.cinevaultapp.dto.MovieDto;
import com.cinevault.cinevaultapp.repository.IWatchlistGroupRepository;
import com.cinevault.cinevaultapp.repository.IWatchListRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service class for managing named watchlist groups.
 * Handles creation, retrieval, deletion, and item assignment for watchlist groups.
 *
 * @author karthicknathan
 * @since Mar 2026
 *
 * @version 1.0
 */
@Service
public class WatchlistGroupService {

    @Autowired
    private IWatchlistGroupRepository groupRepository;

    @Autowired
    private IWatchListRepository watchListRepository;

    @Autowired
    private AuthServices authServices;

    @Autowired
    private TmdbServices tmdbServices;

    /**
     * Creates a new named watchlist group for the authenticated user.
     *
     * @param username  - The authenticated user's username.
     * @param groupName - The desired display name for the new group.
     *
     * @return - The created group as a {@link WatchlistGroupDto}.
     */
    public WatchlistGroupDto createGroup(String username, String groupName) {
        UserEntity user = authServices.getUser(username);

        WatchlistGroupEntity group = new WatchlistGroupEntity();
        group.setName(groupName.trim());
        group.setUserEntity(user);

        WatchlistGroupEntity saved = groupRepository.save(group);
        return toDto(saved);
    }

    /**
     * Retrieves all watchlist groups belonging to the authenticated user.
     *
     * @param username - The authenticated user's username.
     *
     * @return - List of {@link WatchlistGroupDto} objects for the user.
     */
    public List<WatchlistGroupDto> getGroups(String username) {
        UserEntity user = authServices.getUser(username);
        return groupRepository.findByUserEntity(user)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Deletes a watchlist group by ID.
     * Cascades to all items inside the group via {@code orphanRemoval = true}.
     * Enforces ownership — users can only delete their own groups.
     *
     * @param username - The authenticated user's username.
     * @param groupId  - The ID of the group to delete.
     *
     * @throws RuntimeException - If the group is not found or not owned by the user.
     */
    public void deleteGroup(String username, Long groupId) {
        UserEntity user = authServices.getUser(username);
        WatchlistGroupEntity group = groupRepository
                .findByIdAndUserEntity(groupId, user)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        groupRepository.delete(group);
    }

    /**
     * Adds a media item to a specific watchlist group.
     * Prevents duplicate entries within the same group for the same movie ID.
     *
     * @param username - The authenticated user's username.
     * @param groupId  - The target group ID.
     * @param dto      - The watchlist item details to add.
     *
     * @throws RuntimeException - If the group is not found, not owned by the user,
     *                            or the item already exists in the group.
     */
    public void addItemToGroup(String username, Long groupId, WatchListDto dto) {
        UserEntity user = authServices.getUser(username);
        WatchlistGroupEntity group = groupRepository
                .findByIdAndUserEntity(groupId, user)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Prevent duplicates within the same group.
        watchListRepository
                .findByUserEntityAndMovieIdAndWatchlistGroup(user, dto.getMovieId(), group)
                .ifPresent(existing -> {
                    throw new RuntimeException("Item already in this watchlist");
                });

        WatchListEntity entity = new WatchListEntity();
        entity.setMovieId(dto.getMovieId());
        entity.setMovieTitle(dto.getMovieTitle());
        entity.setMediaType(dto.getMediaType());
        entity.setFavorite(dto.isFavorite());
        entity.setUserEntity(user);
        entity.setWatchlistGroup(group);

        watchListRepository.save(entity);
    }

    /**
     * Retrieves all items inside a specific watchlist group with enriched TMDB details.
     * Enforces ownership — users can only view their own groups.
     *
     * @param username - The authenticated user's username.
     * @param groupId  - The ID of the group to retrieve items from.
     *
     * @return - List of {@link WatchListDto} with poster, backdrop, and genre data populated.
     *
     * @throws RuntimeException - If the group is not found or not owned by the user.
     */
    public List<WatchListDto> getGroupItems(String username, Long groupId) {
        UserEntity user = authServices.getUser(username);
        WatchlistGroupEntity group = groupRepository
                .findByIdAndUserEntity(groupId, user)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        return watchListRepository.findByWatchlistGroup(group)
                .stream()
                .map(w -> {
                    MovieDto media = tmdbServices.getMediaDetails(
                            MediaTypeEnum.valueOf(w.getMediaType().toUpperCase()),
                            w.getMovieId()
                    );
                    return new WatchListDto(
                            w.getMovieId(),
                            w.getMovieTitle(),
                            w.isFavorite(),
                            media.getPoster_path(),
                            media.getBackdrop_path(),
                            w.getMediaType(),
                            w.getWatchStatus(),
                            getGenreNames(media)
                    );
                })
                .toList();
    }

    /**
     * Maps a {@link WatchlistGroupEntity} to its DTO representation.
     * Includes the current item count for display in the UI.
     *
     * @param entity - The entity to map.
     *
     * @return - The mapped {@link WatchlistGroupDto}.
     */
    private WatchlistGroupDto toDto(WatchlistGroupEntity entity) {
        return new WatchlistGroupDto(
                entity.getId(),
                entity.getName(),
                entity.getItems().size()
        );
    }

    /**
     * Extracts genre names from a {@link MovieDto}.
     *
     * @param movieDto - The media DTO containing genre objects.
     *
     * @return - List of genre name strings, or empty list if none present.
     */
    private List<String> getGenreNames(MovieDto movieDto) {
        return movieDto.getGenres() != null
                ? movieDto.getGenres().stream().map(g -> g.getName()).toList()
                : List.of();
    }
}
