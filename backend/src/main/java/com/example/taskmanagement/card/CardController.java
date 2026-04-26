package com.example.taskmanagement.card;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    private final CardRepository repository;

    public CardController(CardRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Card> list() {
        return repository.findAllByOrderByColumnIdAscOrderIndexAsc();
    }

    @PostMapping
    public ResponseEntity<Card> create(@Valid @RequestBody CardCreateRequest request) {
        Card card = new Card();
        card.setTitle(request.title());
        card.setDescription(request.description());
        if (request.priority() != null) {
            card.setPriority(request.priority());
        }
        card.setDueDate(request.dueDate());
        card.setColumnId(request.columnId());
        card.setOrderIndex(request.orderIndex());
        Card saved = repository.save(card);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
