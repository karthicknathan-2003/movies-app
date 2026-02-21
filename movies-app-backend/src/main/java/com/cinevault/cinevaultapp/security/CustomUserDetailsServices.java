package com.cinevault.cinevaultapp.security;

import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.repository.IUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Custom implementation of Spring Security's {@code UserDetailsService}.
 * Loads user-specific data for authentication and authorization.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Service
public class CustomUserDetailsServices implements UserDetailsService {

    @Autowired
    private IUserRepository userRepository;

    /**
     * Loads a user by their username for authentication.
     * Retrieves user information from the database and converts it to a Spring Security {@code UserDetails} object.
     *
     * @param userName - The username of the user to load.
     *
     * @return - A {@code UserDetails} object containing the user's authentication information.
     *
     * @throws UsernameNotFoundException - If no user is found with the given username.
     */
    @Override
    public UserDetails loadUserByUsername(String userName) {
        UserEntity user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new org.springframework.security.core.userdetails.User(
                user.getUserName(),
                user.getPassword(),
                List.of()
        );
    }
}