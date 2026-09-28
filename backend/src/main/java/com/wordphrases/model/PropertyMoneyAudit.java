package com.wordphrases.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "property_money_audit")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyMoneyAudit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "entity_type", nullable = false, length = 40) private String entityType;
    @Column(name = "entity_id", nullable = false) private Long entityId;
    @Column(name = "field_name", nullable = false, length = 80) private String fieldName;
    @Column(name = "old_value", columnDefinition = "TEXT") private String oldValue;
    @Column(name = "new_value", columnDefinition = "TEXT") private String newValue;
    @Column(name = "changed_at", nullable = false) private Instant changedAt;
}
