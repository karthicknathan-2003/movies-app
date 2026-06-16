package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.EpisodeProgressDto;
import com.cinevault.cinevaultapp.dto.EpisodeDto;
import com.cinevault.cinevaultapp.dto.MovieDto;
import com.cinevault.cinevaultapp.dto.TvDetailsDto;
import com.cinevault.cinevaultapp.dto.WatchListDto;
import com.cinevault.cinevaultapp.dto.WatchlistStatusDto;
import com.cinevault.cinevaultapp.entity.EpisodeProgressEntity;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.entity.WatchListEntity;
import com.cinevault.cinevaultapp.entity.WatchlistGroupEntity;
import com.cinevault.cinevaultapp.enums.MediaTypeEnum;
import com.cinevault.cinevaultapp.enums.WatchStatusEnum;
import com.cinevault.cinevaultapp.repository.IEpisodeProgressRepository;
import com.cinevault.cinevaultapp.repository.IUserRepository;
import com.cinevault.cinevaultapp.repository.IWatchListRepository;
import com.cinevault.cinevaultapp.repository.IWatchlistGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

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
    private static final Logger LOGGER = Logger.getLogger(WatchListServices.class.getName());

    @Autowired
    private IWatchListRepository watchListRepository;

    @Autowired
    private IWatchlistGroupRepository watchlistGroupRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IEpisodeProgressRepository episodeProgressRepository;

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
        validateWatchListPayload(dto);
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> {
                    LOGGER.warning("Watchlist save failed because user was not found: " + username);
                    return new RuntimeException("User not found");
                });
        // avoid duplicates
        watchListRepository.findByUserEntityAndMovieId(user, dto.getMovieId())
                .ifPresent(item -> {
                    LOGGER.warning("Duplicate watchlist add prevented for user " + username + " and movieId " + dto.getMovieId());
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
                            w.getPersonalRating(),
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
        validateMovieId(movieId);
        validateGroupId(groupId);
        UserEntity user = authServices.getUser(username);
        WatchlistGroupEntity watchlistGroup = watchlistGroupRepository.findById(groupId)
                .orElseThrow(() -> {
                    LOGGER.warning("Watchlist remove failed because group was not found. groupId=" + groupId);
                    return new RuntimeException("Watchlist group not found");
                });
        WatchListEntity entity = watchListRepository
                .findByUserEntityAndMovieIdAndWatchlistGroup(user, movieId, watchlistGroup)
                .orElseThrow(() -> {
                    LOGGER.warning("Watchlist remove failed because movie was not found. user=" + username + ", movieId=" + movieId + ", groupId=" + groupId);
                    return new RuntimeException("Movie not found");
                });

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
        validateMovieId(movieId);
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
                            entity.getPersonalRating(),
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
        validateMovieId(movieId);
        UserEntity user = authServices.getUser(username);
        // If no group provided, check across all groups
        if (watchListGroup == null) {
            return watchListRepository
                    .findByUserEntityAndMovieId(user, movieId)
                    .map(entity -> new WatchlistStatusDto(
                            true,
                            entity.isFavorite(),
                            entity.getWatchStatus(),
                            entity.getPersonalRating()
                    ))
                    .orElseGet(() -> new WatchlistStatusDto(false, false, null, null));
        }
        // Find the group — if it doesn't exist, movie can't be in it
        validateGroupId(watchListGroup);
        Optional<WatchlistGroupEntity> watchlistGroup = watchlistGroupRepository
                .findById(watchListGroup);
        if (watchlistGroup.isEmpty()) {
            return new WatchlistStatusDto(false, false, null, null);
        }
        return watchListRepository
                .findByUserEntityAndMovieIdAndWatchlistGroup(user, movieId, watchlistGroup.get())
                .map(entity -> new WatchlistStatusDto(
                        true,
                        entity.isFavorite(),
                        entity.getWatchStatus(),
                        entity.getPersonalRating()
                ))
                .orElseGet(() -> new WatchlistStatusDto(false, false, null, null));
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
        validateMovieId(movieId);
        if (status == null) {
            throw new IllegalArgumentException("Watch status is required");
        }
        UserEntity user = authServices.getUser(username);
        List<WatchListEntity> items = watchListRepository.findAllByUserEntityAndMovieId(user, movieId);
        if (items.isEmpty()) {
            LOGGER.warning("Status update failed because item was not found. user=" + username + ", movieId=" + movieId);
            throw new RuntimeException("Item not found in watchlist");
        }

        // Keep every saved copy of the same title in sync across groups.
        items.forEach(item -> item.setWatchStatus(status));
        watchListRepository.saveAll(items);

        // Completing a show should also complete all of its episodes in the progress tracker.
        if (status == WatchStatusEnum.COMPLETED) {
            syncCompletedEpisodeProgress(user, items.get(0));
        }
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
        validateMovieId(movieId);
        UserEntity user = authServices.getUser(userName);
        List<WatchListEntity> items = watchListRepository.findAllByUserEntityAndMovieId(user, movieId);
        if (items.isEmpty()) {
            LOGGER.warning("Favorite update failed because item was not found. user=" + userName + ", movieId=" + movieId);
            throw new RuntimeException("Item not found in watchlist");
        }

        items.forEach(item -> item.setFavorite(favorite));
        watchListRepository.saveAll(items);
    }

    /**
     * Updates the personal star rating on every saved copy of a title.
     * A null rating clears the previous value.
     *
     * @param userName       - The username of the authenticated user.
     * @param movieId        - The unique identifier of the movie/show to update.
     * @param personalRating - The new 1-5 star rating, or null to clear it.
     */
    public void updatePersonalRating(String userName, Long movieId, Integer personalRating) {
        validateMovieId(movieId);
        if (personalRating != null && (personalRating < 1 || personalRating > 5)) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        UserEntity user = authServices.getUser(userName);
        List<WatchListEntity> items = watchListRepository.findAllByUserEntityAndMovieId(user, movieId);
        if (items.isEmpty()) {
            LOGGER.warning("Rating update failed because item was not found. user=" + userName + ", movieId=" + movieId);
            throw new RuntimeException("Item not found in watchlist");
        }

        items.forEach(item -> item.setPersonalRating(personalRating));
        watchListRepository.saveAll(items);
    }

    /**
     * Reads all watched-episode markers for a specific show.
     */
    public List<EpisodeProgressDto> getEpisodeProgress(String username, Long movieId) {
        validateMovieId(movieId);
        UserEntity user = authServices.getUser(username);
        return episodeProgressRepository
                .findByUserEntityAndMovieIdOrderBySeasonNumberAscEpisodeNumberAsc(user, movieId)
                .stream()
                .map(this::toEpisodeProgressDto)
                .toList();
    }

    /**
     * Creates or removes one watched-episode marker.
     * The frontend sends watched=true to save the row and watched=false to remove it.
     */
    @Transactional
    public EpisodeProgressDto updateEpisodeProgress(String username, Long movieId, EpisodeProgressDto dto) {
        validateMovieId(movieId);
        validateEpisodeProgressPayload(dto);
        UserEntity user = authServices.getUser(username);

        Optional<EpisodeProgressEntity> existing = episodeProgressRepository
                .findByUserEntityAndMovieIdAndSeasonNumberAndEpisodeNumber(
                        user,
                        movieId,
                        dto.getSeasonNumber(),
                        dto.getEpisodeNumber()
                );

        // Removing the row is enough to mark an episode as unwatched.
        if (Boolean.FALSE.equals(dto.getWatched())) {
            existing.ifPresent(episodeProgressRepository::delete);
            dto.setWatched(false);
            dto.setWatchedAt(null);
            return dto;
        }

        EpisodeProgressEntity entity = existing.orElseGet(EpisodeProgressEntity::new);
        entity.setUserEntity(user);
        entity.setMovieId(movieId);
        entity.setMediaType("tv");
        entity.setSeasonNumber(dto.getSeasonNumber());
        entity.setEpisodeNumber(dto.getEpisodeNumber());
        entity.setEpisodeName(dto.getEpisodeName());
        entity.setRuntimeMinutes(dto.getRuntimeMinutes());
        entity.setWatchedAt(LocalDateTime.now());

        EpisodeProgressEntity saved = episodeProgressRepository.save(entity);
        return toEpisodeProgressDto(saved);
    }

    /**
     * Maps a persisted episode progress row into the API DTO returned to the client.
     *
     * @param entity - Stored episode progress entity.
     *
     * @return - DTO describing the watched episode state.
     */
    private EpisodeProgressDto toEpisodeProgressDto(EpisodeProgressEntity entity) {
        return new EpisodeProgressDto(
                entity.getSeasonNumber(),
                entity.getEpisodeNumber(),
                entity.getEpisodeName(),
                entity.getRuntimeMinutes(),
                true,
                entity.getWatchedAt()
        );
    }

    /**
     * Backfills all episode progress rows when a show is marked as completed.
     *
     * @param user - Owner of the watchlist entry.
     * @param item - Watchlist item that was moved into the completed state.
     */
    private void syncCompletedEpisodeProgress(UserEntity user, WatchListEntity item) {
        if (!"tv".equalsIgnoreCase(item.getMediaType())) {
            return;
        }

        try {
            MovieDto media = tmdbServices.getMediaDetails(MediaTypeEnum.TV, item.getMovieId());
            TvDetailsDto tvDetails = isLikelyAnime(media)
                    ? tmdbServices.getAnimeSeasons(item.getMovieId())
                    : tmdbServices.getTvDetails(MediaTypeEnum.TV, item.getMovieId());

            if (tvDetails == null || tvDetails.getSeasons() == null || tvDetails.getSeasons().isEmpty()) {
                LOGGER.warning("Episode completion sync skipped because season data was empty for movieId=" + item.getMovieId());
                return;
            }

            int defaultEpisodeRuntime = media.getEpisode_run_time() != null && !media.getEpisode_run_time().isEmpty()
                    ? Optional.ofNullable(media.getEpisode_run_time().get(0)).orElse(0)
                    : 0;

            Map<String, EpisodeProgressEntity> existingProgressByKey = episodeProgressRepository
                    .findByUserEntityAndMovieIdOrderBySeasonNumberAscEpisodeNumberAsc(user, item.getMovieId())
                    .stream()
                    .collect(java.util.stream.Collectors.toMap(
                            progress -> progress.getSeasonNumber() + "-" + progress.getEpisodeNumber(),
                            progress -> progress,
                            (left, right) -> left
                    ));

            LocalDateTime completedAt = LocalDateTime.now();
            List<EpisodeProgressEntity> updatedProgress = tvDetails.getSeasons().stream()
                    .filter(season -> season.getSeason_number() > 0 && season.getEpisodes() != null)
                    .flatMap(season -> season.getEpisodes().stream().map(episode -> {
                        String progressKey = season.getSeason_number() + "-" + episode.getEpisode_number();
                        EpisodeProgressEntity progress = existingProgressByKey.getOrDefault(progressKey, new EpisodeProgressEntity());
                        progress.setUserEntity(user);
                        progress.setMovieId(item.getMovieId());
                        progress.setMediaType("tv");
                        progress.setSeasonNumber(season.getSeason_number());
                        progress.setEpisodeNumber(episode.getEpisode_number());
                        progress.setEpisodeName(episode.getName());
                        progress.setRuntimeMinutes(resolveEpisodeRuntime(episode, defaultEpisodeRuntime));
                        progress.setWatchedAt(progress.getWatchedAt() != null ? progress.getWatchedAt() : completedAt);
                        return progress;
                    }))
                    .toList();
            if (!updatedProgress.isEmpty()) {
                episodeProgressRepository.saveAll(updatedProgress);
            }
        } catch (Exception ex) {
            // Preserve the completed status update while still logging sync failures for debugging.
            LOGGER.log(Level.SEVERE, "Episode completion sync failed for movieId=" + item.getMovieId(), ex);
        }
    }

    /**
     * Detects anime titles so season data can come from the anime-specific endpoint when needed.
     *
     * @param media - Media details fetched from TMDB.
     *
     * @return - {@code true} when the title looks like Japanese animation, otherwise {@code false}.
     */
    private boolean isLikelyAnime(MovieDto media) {
        if (media == null || media.getGenres() == null) {
            return false;
        }

        boolean hasAnimationGenre = media.getGenres().stream()
                .anyMatch(genre -> genre.getId() != null && genre.getId() == 16L);

        return hasAnimationGenre && "ja".equalsIgnoreCase(media.getOriginal_language());
    }

    /**
     * Resolves episode runtime for synced progress rows.
     *
     * @param episode - Episode details for the current row.
     * @param defaultEpisodeRuntime - Fallback runtime derived from the series payload.
     * @return - Best available runtime in minutes for the episode.
     */
    private int resolveEpisodeRuntime(EpisodeDto episode, int defaultEpisodeRuntime) {
        // Episode-level runtime is not consistently available, so the series fallback stays the stable source.
        return defaultEpisodeRuntime;
    }

    /**
     * Validates the core watchlist payload before the item is saved.
     *
     * @param dto - Incoming watchlist request body.
     *
     * @throws IllegalArgumentException - If required watchlist fields are missing.
     */
    private void validateWatchListPayload(WatchListDto dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Watchlist payload is required");
        }
        validateMovieId(dto.getMovieId());
        if (dto.getMovieTitle() == null || dto.getMovieTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Movie title is required");
        }
        if (dto.getMediaType() == null || dto.getMediaType().trim().isEmpty()) {
            throw new IllegalArgumentException("Media type is required");
        }
    }

    /**
     * Validates a watched-episode payload before creating or deleting progress rows.
     *
     * @param dto - Episode progress request body.
     *
     * @throws IllegalArgumentException - If season, episode, or runtime values are invalid.
     */
    private void validateEpisodeProgressPayload(EpisodeProgressDto dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Episode progress payload is required");
        }
        if (dto.getSeasonNumber() == null || dto.getSeasonNumber() <= 0) {
            throw new IllegalArgumentException("Season number must be greater than 0");
        }
        if (dto.getEpisodeNumber() == null || dto.getEpisodeNumber() <= 0) {
            throw new IllegalArgumentException("Episode number must be greater than 0");
        }
        if (dto.getRuntimeMinutes() != null && dto.getRuntimeMinutes() < 0) {
            throw new IllegalArgumentException("Runtime minutes cannot be negative");
        }
    }

    /**
     * Validates that a media identifier is present and positive.
     *
     * @param movieId - Media identifier from the request.
     *
     * @throws IllegalArgumentException - If the identifier is null or non-positive.
     */
    private void validateMovieId(Long movieId) {
        if (movieId == null || movieId <= 0) {
            throw new IllegalArgumentException("Movie id must be a positive number");
        }
    }

    /**
     * Validates that a watchlist group identifier is present and positive.
     *
     * @param groupId - Group identifier from the request.
     *
     * @throws IllegalArgumentException - If the identifier is null or non-positive.
     */
    private void validateGroupId(Long groupId) {
        if (groupId == null || groupId <= 0) {
            throw new IllegalArgumentException("Group id must be a positive number");
        }
    }
}