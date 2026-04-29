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

    public Card updatePosition(String id, UpdateCardPositionRequest request) {
        Card card = repository.findById(id)
                .orElseThrow(() -> new CardNotFoundException(id));

        String fromColumnId = card.getColumnId();
        String toColumnId = request.columnId();
        int targetIndex = request.orderIndex();

        if (fromColumnId.equals(toColumnId)) {
            List<Card> siblings = repository.findByColumnIdOrderByOrderIndexAsc(toColumnId).stream()
                    .filter(c -> !c.getId().equals(id))
                    .collect(java.util.stream.Collectors.toList());
            int insertAt = Math.min(targetIndex, siblings.size());
            siblings.add(insertAt, card);
            for (int i = 0; i < siblings.size(); i++) {
                Card c = siblings.get(i);
                if (c.getOrderIndex() == null || c.getOrderIndex() != i) {
                    c.setOrderIndex(i);
                    repository.save(c);
                }
            }
            return card;
        }

        List<Card> fromSiblings = repository.findByColumnIdOrderByOrderIndexAsc(fromColumnId).stream()
                .filter(c -> !c.getId().equals(id))
                .collect(java.util.stream.Collectors.toList());
        for (int i = 0; i < fromSiblings.size(); i++) {
            Card c = fromSiblings.get(i);
            if (c.getOrderIndex() == null || c.getOrderIndex() != i) {
                c.setOrderIndex(i);
                repository.save(c);
            }
        }

        List<Card> toSiblings = repository.findByColumnIdOrderByOrderIndexAsc(toColumnId);
        int insertAt = Math.min(targetIndex, toSiblings.size());
        card.setColumnId(toColumnId);
        toSiblings.add(insertAt, card);
        for (int i = 0; i < toSiblings.size(); i++) {
            Card c = toSiblings.get(i);
            if (c.getOrderIndex() == null || c.getOrderIndex() != i) {
                c.setOrderIndex(i);
                repository.save(c);
            }
        }
        return card;
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
