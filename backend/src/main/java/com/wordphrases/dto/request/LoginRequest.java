package com.wordphrases.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload for user login. Accepts either username or email as the identifier.
 */
@Data
public class LoginRequest {

    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;
}
