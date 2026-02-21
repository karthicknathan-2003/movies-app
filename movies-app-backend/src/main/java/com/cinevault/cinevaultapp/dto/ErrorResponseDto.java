package com.cinevault.cinevaultapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data Transfer Object for error responses.
 * Used to send standardized error messages to the client.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Data
@AllArgsConstructor
public class ErrorResponseDto {
    /**
     * The error message describing what went wrong.
     */
    private String message;
}