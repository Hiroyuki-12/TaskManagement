package com.example.taskmanagement.card;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CardCreateRequest(
        @NotBlank @Size(max = 100) String title,
        @Size(max = 1000) String description,
        @Pattern(regexp = "high|medium|low") String priority,
        LocalDate dueDate,
        @NotBlank @Pattern(regexp = "todo|doing|done") String columnId,
        @NotNull Integer orderIndex
) {}
