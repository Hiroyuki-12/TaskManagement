package com.example.taskmanagement.card;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateCardContentRequest(
        @NotBlank @Size(max = 100) String title,
        @Size(max = 1000) String description,
        @NotBlank @Pattern(regexp = "high|medium|low") String priority,
        LocalDate dueDate
) {}
