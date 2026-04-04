package com.wordphrases.repository;

import com.wordphrases.model.Category;
import com.wordphrases.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access layer for {@link Category} entities.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUserOrderByNameAsc(User user);

    Optional<Category> findByIdAndUser(Long id, User user);

    boolean existsByNameAndUser(String name, User user);

    @Query("SELECT c, COUNT(w) FROM Category c LEFT JOIN c.words w WHERE c.user = :user GROUP BY c ORDER BY c.name ASC")
    List<Object[]> findCategoriesWithWordCount(@Param("user") User user);
}
