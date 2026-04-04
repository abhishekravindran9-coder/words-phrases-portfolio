package com.wordphrases.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Payload for creating or updating a word category.
 */
@Data
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name must be at most 100 characters")
    private String name;

    /** Hex color code, e.g. "#4F46E5". */
    private String color;

    private String description;
}
