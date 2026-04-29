package com.example.taskmanagement.card;

import jakarta.validation.Valid;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    private static final Logger log = LoggerFactory.getLogger(CardController.class);

    private final CardService service;

    public CardController(CardService service) {
        this.service = service;
    }

    @GetMapping
    public List<CardResponse> list(@RequestParam(required = false) String columnId) {
        List<Card> cards =
                (columnId != null && !columnId.isBlank())
                        ? service.findByColumn(columnId)
                        : service.findAll();
        return cards.stream().map(CardResponse::from).toList();
    }

    @GetMapping("/{id}")
    public CardResponse get(@PathVariable String id) {
        return CardResponse.from(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<CardResponse> create(@Valid @RequestBody CardCreateRequest request) {
        Card saved = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(CardResponse.from(saved));
    }

    @PatchMapping("/{id}")
    public CardResponse update(
            @PathVariable String id, @Valid @RequestBody UpdateCardRequest request) {
        return CardResponse.from(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        log.info("Card delete request completed id={}", id);
        return ResponseEntity.noContent().build();
    }
}
