package com.wordphrases.service;

import com.wordphrases.model.User;
import com.wordphrases.repository.UserRepository;
import com.wordphrases.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Provides helper methods to resolve the authenticated user entity from their ID.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    @Transactional
    public User updateProfile(Long userId, String displayName, String profilePictureUrl, String timezone) {
        User user = getUserById(userId);
        if (displayName != null) user.setDisplayName(displayName);
        if (profilePictureUrl != null) user.setProfilePictureUrl(profilePictureUrl);
        if (timezone != null) user.setTimezone(timezone);
        return userRepository.save(user);
    }
}
