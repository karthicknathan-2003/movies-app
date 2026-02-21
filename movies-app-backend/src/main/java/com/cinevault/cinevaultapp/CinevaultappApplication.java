package com.cinevault.cinevaultapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main application class for the CineVault application.
 * This is the entry point for the Spring Boot application that manages
 * movie and TV show watchlist with TMDB API integration.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@SpringBootApplication
@EnableCaching
public class CinevaultappApplication {
	/**
	 * Main method that starts the Spring Boot application.
	 *
	 * @param args - Command line arguments passed to the application.
	 */
	public static void main(String[] args) {
		SpringApplication.run(CinevaultappApplication.class, args);
	}
}