package com.example.taskmanagement.card;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CardService {

    private final CardRepository repository;

    public CardService(CardRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Card> findAll() {
        return repository.findAllByOrderByColumnIdAscOrderIndexAsc();
    }

    @Transactional(readOnly = true)
    public List<Card> findByColumn(String columnId) {
        return repository.findByColumnIdOrderByOrderIndexAsc(columnId);
    }

    @Transactional(readOnly = true)
    public Card findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new CardNotFoundException(id));
    }

    public Card updateContent(String id, UpdateCardContentRequest request) {
        Card card = repository.findById(id)
                .orElseThrow(() -> new CardNotFoundException(id));
        card.setTitle(request.title());
        card.setDescription(request.description());
        card.setPriority(request.priority());
        card.setDueDate(request.dueDate());
        return repository.save(card);
    }

    public Card create(CardCreateRequest request) {
        Card card = new Card();
        card.setTitle(request.title());
        card.setDescription(request.description());
        if (request.priority() != null) {
            card.setPriority(request.priority());
        }
        card.setDueDate(request.dueDate());
        card.setColumnId(request.columnId());
        card.setOrderIndex(request.orderIndex());
        return repository.save(card);
    }
}
