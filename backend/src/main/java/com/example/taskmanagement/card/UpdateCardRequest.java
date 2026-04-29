package com.example.taskmanagement.card;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * 部分更新リクエスト。null のフィールドは「変更なし」を意味する。
 *
 * <p>編集（内容更新）は title/description/priority/dueDate の組で送る前提とする。 位置更新は columnId/orderIndex
 * を組で送る前提とする。両方を同時に送ることも可能。
 */
public record UpdateCardRequest(
        @Size(min = 1, max = 100) String title,
        @Size(max = 1000) String description,
        @Pattern(regexp = "high|medium|low") String priority,
        LocalDate dueDate,
        @Pattern(regexp = "todo|doing|done") String columnId,
        @PositiveOrZero Integer orderIndex) {}
