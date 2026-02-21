package com.cinevault.cinevaultapp.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entity class representing a user in the database.
 * Stores user authentication and profile information.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Entity
@Table(name = "users")
@Data
public class UserEntity {
    /**
     * The unique identifier for the user.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user's first name.
     */
    private String firstName;

    /**
     * The user's last name.
     */
    private String lastName;

    /**
     * The unique username for authentication.
     * Must be unique across all users.
     */
    @Column(unique = true)
    private String userName;

    /**
     * The user's encrypted password.
     */
    private String password;
}