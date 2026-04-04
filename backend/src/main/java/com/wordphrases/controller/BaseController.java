package com.wordphrases.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Base class providing a helper to retrieve the authenticated user's ID
 * from the Spring Security context without repeating boilerplate code.
 */
public abstract class BaseController {

    /**
     * Extracts the current user's ID from the SecurityContext.
     * The subject stored in the JWT (and in UserDetails.getUsername()) is the user ID.
     *
     * @return the authenticated user's primary key
     */
    protected Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Long.parseLong(authentication.getName());
    }
}
