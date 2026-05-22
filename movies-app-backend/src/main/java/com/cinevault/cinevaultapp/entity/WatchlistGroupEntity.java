package com.cinevault.cinevaultapp.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a named watchlist group owned by a user.
 * A user can have multiple watchlist groups (e.g. "Action Movies", "Weekend Watch").
 * Each group contains zero or more {@link WatchListEntity} items.
 *
 * @author karthicknathan
 * @since Mar 20, 2026
 *
 * @version 1.0
 */
@Entity
@Table(name = "watchlist_group")
@Data
public class WatchlistGroupEntity {

    /**
     * The unique identifier for this watchlist group.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The display name of this watchlist group.
     */
    @Column(nullable = false)
    private String name;

    /**
     * The user who owns this watchlist group.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity userEntity;

    /**
     * All watchlist items belonging to this group.
     * Orphaned items are removed automatically when the group is deleted.
     */
    @OneToMany(mappedBy = "watchlistGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WatchListEntity> items = new ArrayList<>();
}