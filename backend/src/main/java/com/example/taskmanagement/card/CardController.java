package com.example.taskmanagement.card;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    private final CardService service;

    public CardController(CardService service) {
        this.service = service;
    }

    @GetMapping
    public List<Card> list(@RequestParam(required = false) String columnId) {
        if (columnId != null && !columnId.isBlank()) {
            return service.findByColumn(columnId);
        }
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Card get(@PathVariable String id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<Card> create(@Valid @RequestBody CardCreateRequest request) {
        Card saved = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Card updateContent(@PathVariable String id, @Valid @RequestBody UpdateCardContentRequest request) {
        return service.updateContent(id, request);
    }

    @PatchMapping("/{id}/position")
    public Card updatePosition(@PathVariable String id, @Valid @RequestBody UpdateCardPositionRequest request) {
        return service.updatePosition(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
