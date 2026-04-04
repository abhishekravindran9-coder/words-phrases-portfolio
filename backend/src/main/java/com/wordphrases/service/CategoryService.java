package com.wordphrases.service;

import com.wordphrases.dto.request.CategoryRequest;
import com.wordphrases.dto.response.CategoryResponse;
import com.wordphrases.exception.DuplicateResourceException;
import com.wordphrases.exception.ResourceNotFoundException;
import com.wordphrases.model.Category;
import com.wordphrases.model.User;
import com.wordphrases.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Business logic for word categories (CRUD).
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoriesForUser(Long userId) {
        User user = userService.getUserById(userId);
        List<Object[]> rows = categoryRepository.findCategoriesWithWordCount(user);
        return rows.stream().map(row -> {
            Category c = (Category) row[0];
            Long count = (Long) row[1];
            return toCategoryResponse(c, count);
        }).toList();
    }

    @Transactional
    public CategoryResponse createCategory(Long userId, CategoryRequest request) {
        User user = userService.getUserById(userId);

        if (categoryRepository.existsByNameAndUser(request.getName(), user)) {
            throw new DuplicateResourceException("Category '" + request.getName() + "' already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .color(request.getColor())
                .description(request.getDescription())
                .user(user)
                .build();

        return toCategoryResponse(categoryRepository.save(category), 0L);
    }

    @Transactional
    public CategoryResponse updateCategory(Long userId, Long categoryId, CategoryRequest request) {
        User user = userService.getUserById(userId);
        Category category = categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        category.setName(request.getName());
        if (request.getColor() != null) category.setColor(request.getColor());
        if (request.getDescription() != null) category.setDescription(request.getDescription());

        return toCategoryResponse(categoryRepository.save(category), (long) category.getWords().size());
    }

    @Transactional
    public void deleteCategory(Long userId, Long categoryId) {
        User user = userService.getUserById(userId);
        Category category = categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        categoryRepository.delete(category);
    }

    private CategoryResponse toCategoryResponse(Category category, Long wordCount) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .color(category.getColor())
                .description(category.getDescription())
                .wordCount(wordCount)
                .createdAt(category.getCreatedAt())
                .build();
    }
}
