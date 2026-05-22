package com.cinevault.cinevaultapp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Raw deserialization target for the Jikan v4 /anime/{id}/reviews endpoint.
 * Jikan review shape (simplified):
 * {
 *   "data": [
 *     {
 *       "mal_id": 123,
 *       "url": "https://myanimelist.net/reviews.php?id=123",
 *       "type": "anime",
 *       "date": "2023-01-15T00:00:00+00:00",
 *       "review": "Full text of the review…",
 *       "score": 9,
 *       "user": {
 *         "username": "SomeUser",
 *         "url": "https://myanimelist.net/profile/SomeUser",
 *         "images": {
 *           "jpg": { "image_url": "https://cdn.myanimelist.net/images/userimages/123.jpg" }
 *         }
 *       }
 *     }
 *   ],
 *   "pagination": {
 *     "last_visible_page": 3,
 *     "has_next_page": true,
 *     "current_page": 1,
 *     "items": { "count": 25, "total": 60, "per_page": 20 }
 *   }
 * }
 *
 * @author karthicknathan
 * @since Mar 20, 2026
 *
 * @version 1.0
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class JikanReviewsResponse {

    private List<JikanReview> data;
    private Pagination pagination;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class JikanReview {
        private Long mal_id;
        private String url;
        private String type;
        private String date;       // ISO-8601 datetime string
        private String review;     // full review text
        private Integer score;     // 1–10 rating given by the reviewer
        private JikanUser user;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class JikanUser {
        private String username;
        private String url;
        private JikanImages images;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class JikanImages {
        private JikanImageSet jpg;
        private JikanImageSet webp;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class JikanImageSet {
        private String image_url;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Pagination {
        private int last_visible_page;
        private boolean has_next_page;
        private int current_page;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public class ExternalIdsDto {
        /**
         * MyAnimeList ID for the TV series, or null if TMDB does not have one.
         */
        private Long mal_id;
    }
}