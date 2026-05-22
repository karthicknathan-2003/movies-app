package com.cinevault.cinevaultapp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.HashSet;
import java.util.Set;

/**
 * Entity class representing a user in the database.
 * Stores user authentication and profile information.
 *
 * IMPORTANT:
 * equals() and hashCode() must rely only on the primary key.
 * This is required for ManyToMany contains(), add(), remove()
 * to work correctly after entities are reloaded from the database.
 *
 * Without this, follow/unfollow state may appear incorrect.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 2.0
 */
@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserEntity {

    /**
     * Unique user identifier.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /**
     * User first name.
     */
    private String firstName;

    /**
     * User last name.
     */
    private String lastName;

    /**
     * Unique username.
     */
    @Column(unique = true, nullable = false)
    private String userName;

    /**
     * Encrypted password.
     */
    private String password;

    @Column(length = 500)
    private String bio;

    private String location;

    private String avatarUrl;

    @Column(length = 300)
    private String interests;

    /**
     * Users this user follows.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_follows",
            joinColumns = @JoinColumn(name = "follower_id"),
            inverseJoinColumns = @JoinColumn(name = "following_id")
    )
    private Set<UserEntity> following = new HashSet<>();

    /**
     * Users following this user.
     */
    @ManyToMany(mappedBy = "following", fetch = FetchType.LAZY)
    private Set<UserEntity> followers = new HashSet<>();

    /**
     * Returns the user's full name.
     *
     * @return full name
     */
    public String getFullName() {
        return ((firstName != null ? firstName : "") + " "
                + (lastName != null ? lastName : "")).trim();
    }
}