package com.example.taskmanagement.card;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateCardPositionRequest(
        @NotBlank @Pattern(regexp = "todo|doing|done") String columnId,
        @NotNull @PositiveOrZero Integer orderIndex
) {}
