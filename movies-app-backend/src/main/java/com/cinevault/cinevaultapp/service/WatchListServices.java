package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.MovieDto;
import com.cinevault.cinevaultapp.dto.WatchListDto;
import com.cinevault.cinevaultapp.dto.WatchlistStatusDto;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.entity.WatchListEntity;
import com.cinevault.cinevaultapp.entity.WatchlistGroupEntity;
import com.cinevault.cinevaultapp.enums.MediaTypeEnum;
import com.cinevault.cinevaultapp.enums.WatchStatusEnum;
import com.cinevault.cinevaultapp.repository.IUserRepository;
import com.cinevault.cinevaultapp.repository.IWatchListRepository;
import com.cinevault.cinevaultapp.repository.IWatchlistGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service class for managing user watchlist operations.
 * Provides methods for adding, removing, and retrieving watchlist items with media details.
 *
 * @author karthicknathan
 * @since Feb 06, 2026
 *
 * @version 1.0
 */
@Service
public class WatchListServices {

    @Autowired
    private IWatchListRepository watchListRepository;

    @Autowired
    private IWatchlistGroupRepository watchlistGroupRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private AuthServices authServices;

    @Autowired
    private TmdbServices tmdbServices;

    /**
     * Saves a movie or TV show to the user's watchlist.
     * Prevents duplicate entries for the same movie/show.
     *
     * @param username - The username of the user adding the item.
     * @param dto - The {@code WatchListDto} containing movie/show details to save.
     *
     * @throws RuntimeException - If the user is not found or if the movie is already in the watchlist.
     */
    public void saveToWatchList(String username, WatchListDto dto) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // avoid duplicates
        watchListRepository.findByUserEntityAndMovieId(user, dto.getMovieId())
                .ifPresent(item -> {
                    throw new RuntimeException("Movie already added");
                });
        WatchListEntity entity = new WatchListEntity();
        entity.setMovieId(dto.getMovieId());
        entity.setMovieTitle(dto.getMovieTitle());
        entity.setFavorite(dto.isFavorite());
        entity.setMediaType(dto.getMediaType());
        entity.setUserEntity(user);

        watchListRepository.save(entity);
    }

    /**
     * Retrieves the user's watchlist with complete media details from TMDB.
     * Enriches each watchlist item with poster, backdrop, and genre information.
     *
     * @param username - The username of the user whose watchlist to retrieve.
     *
     * @return - A list of {@code WatchListDto} objects containing complete media details.
     */
    public List<WatchListDto> getWatchListWithDetails(String username) {
        UserEntity user = authServices.getUser(username);

        return watchListRepository
                .findByUserEntity(user)
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
                            getGenreList(media)
                    );
                })
                .toList();
    }

    /**
     * Removes a movie or TV show from the user's watchlist.
     *
     * @param username - The username of the user removing the item.
     * @param movieId - The ID of the movie/show to remove.
     *
     * @throws RuntimeException - If the movie is not found in the user's watchlist.
     */
    public void removeFromWatchList(String username, Long movieId, Long groupId) {
        UserEntity user = authServices.getUser(username);
        Optional<WatchlistGroupEntity> watchlistGroup = watchlistGroupRepository.findById(groupId);
        WatchListEntity entity = watchListRepository
                .findByUserEntityAndMovieIdAndWatchlistGroup(user, movieId, watchlistGroup.get())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        watchListRepository.delete(entity);
    }

    /**
     * Retrieves a specific watchlist item with complete media details.
     *
     * @param username - The username of the user.
     * @param movieId - The ID of the movie/show to retrieve.
     *
     * @return - An Optional containing the {@code WatchListDto} if found, empty otherwise.
     */
    public Optional<WatchListDto> getWatchListItem(String username, Long movieId) {
        UserEntity user = authServices.getUser(username);
        return watchListRepository
                .findByUserEntityAndMovieId(user, movieId)
                .map(entity -> {
                    MovieDto media = tmdbServices.getMediaDetails(
                            MediaTypeEnum.valueOf(entity.getMediaType().toUpperCase()),
                            entity.getMovieId()
                    );

                    return new WatchListDto(
                            entity.getMovieId(),
                            entity.getMovieTitle(),
                            entity.isFavorite(),
                            media.getPoster_path(),
                            media.getBackdrop_path(),
                            entity.getMediaType(),
                            entity.getWatchStatus(),
                            getGenreList(media)
                    );
                });
    }

    /**
     * Retrieves the watchlist status for a specific movie/show.
     * Indicates whether the item is in the watchlist and if it's marked as favorite.
     *
     * @param username - The username of the user.
     * @param movieId - The ID of the movie/show to check.
     *
     * @return - A {@code WatchlistStatusDto} containing the status information.
     */
    public WatchlistStatusDto getWatchlistStatus(String username, Long movieId, Long watchListGroup) {
        UserEntity user = authServices.getUser(username);
        // If no group provided, check across all groups
        if (watchListGroup == null) {
            return watchListRepository
                    .findByUserEntityAndMovieId(user, movieId)
                    .map(entity -> new WatchlistStatusDto(true, entity.isFavorite()))
                    .orElseGet(() -> new WatchlistStatusDto(false, false));
        }
        // Find the group — if it doesn't exist, movie can't be in it
        Optional<WatchlistGroupEntity> watchlistGroup = watchlistGroupRepository
                .findById(watchListGroup);
        if (watchlistGroup.isEmpty()) {
            return new WatchlistStatusDto(false, false);
        }
        return watchListRepository
                .findByUserEntityAndMovieIdAndWatchlistGroup(user, movieId, watchlistGroup.get())
                .map(entity -> new WatchlistStatusDto(true, entity.isFavorite()))
                .orElseGet(() -> new WatchlistStatusDto(false, false));
    }

    /**
     * Updates the watch status of a movie/show in the user's watchlist.
     *
     * @param username - The username of the user.
     * @param movieId - The ID of the movie/show to update.
     * @param status - The new watch status to set.
     *
     * @throws RuntimeException - If the movie is not found in the user's watchlist.
     */
    public void updateStatus(String username, Long movieId, WatchStatusEnum status) {
        UserEntity user = authServices.getUser(username);
        WatchListEntity entity = watchListRepository
                .findByUserEntityAndMovieId(user, movieId)
                .orElseThrow();

        entity.setWatchStatus(status);
        watchListRepository.save(entity);
    }

    /**
     * Extracts genre names from a MovieDto object.
     * Helper method to convert genre objects to a list of genre names.
     *
     * @param movieDto - The {@code MovieDto} containing genre information.
     *
     * @return - A list of genre names, or an empty list if no genres are present.
     */
    private List<String> getGenreList(MovieDto movieDto){
        return movieDto.getGenres() != null
                ? movieDto.getGenres()
                .stream()
                .map(g -> g.getName())
                .toList()
                : List.of();
    }

    /**
     * Updates the favorite status of an existing watchlist item.
     * Throws if the item is not found in the user's watchlist.
     *
     * @param userName - The username of the authenticated user.
     * @param movieId  - The unique identifier of the movie/show to update.
     * @param favorite - The new favorite status to set.
     */
    public void updateFavorite(String userName, Long movieId, boolean favorite) {
        UserEntity user = authServices.getUser(userName);
        WatchListEntity item = watchListRepository
                .findByUserEntityAndMovieId(user, movieId)
                .orElseThrow(() -> new RuntimeException("Item not found in watchlist"));
        item.setFavorite(favorite);
        watchListRepository.save(item);
    }
}