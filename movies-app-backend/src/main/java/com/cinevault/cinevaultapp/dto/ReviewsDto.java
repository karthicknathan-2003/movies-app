package com.cinevault.cinevaultapp.dto;

import lombok.Data;
import java.util.List;

/**
 * Data Transfer Object for TMDB reviews response.
 * Contains paginated reviews for a movie or TV show.
 *
 * @author karthicknathan
 * @since 2026
 * @version 1.0
 */
@Data
public class ReviewsDto {

    private int page;
    private List<Review> results;
    private int total_pages;
    private int total_results;

    @Data
    public static class Review {
        private String id;
        private String author;
        private AuthorDetails author_details;
        private String content;
        private String created_at;
        private String updated_at;
        private String url;
    }

    @Data
    public static class AuthorDetails {
        private String name;
        private String username;
        private String avatar_path;
        private Double rating;
    }
}