package com.example.taskmanagement.card;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** API レスポンス用 DTO。エンティティを外部に直接公開しないために用いる。 */
public record CardResponse(
        String id,
        String title,
        String description,
        String priority,
        LocalDate dueDate,
        String columnId,
        Integer orderIndex,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static CardResponse from(Card card) {
        return new CardResponse(
                card.getId(),
                card.getTitle(),
                card.getDescription(),
                card.getPriority(),
                card.getDueDate(),
                card.getColumnId(),
                card.getOrderIndex(),
                card.getCreatedAt(),
                card.getUpdatedAt());
    }
}
