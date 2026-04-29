package com.example.taskmanagement.card;

import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CardService {

    private static final Logger log = LoggerFactory.getLogger(CardService.class);

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
        return repository.findById(id).orElseThrow(() -> new CardNotFoundException(id));
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
        Card saved = repository.save(card);
        log.info("Card created id={} columnId={}", saved.getId(), saved.getColumnId());
        return saved;
    }

    /** 部分更新を実行する。null のフィールドは変更しない。 columnId が指定された場合は位置の再配置も併せて行う。 */
    public Card update(String id, UpdateCardRequest request) {
        Card card = repository.findById(id).orElseThrow(() -> new CardNotFoundException(id));

        if (request.title() != null) {
            card.setTitle(request.title());
        }
        if (request.description() != null) {
            card.setDescription(request.description());
        }
        if (request.priority() != null) {
            card.setPriority(request.priority());
        }
        if (request.dueDate() != null) {
            card.setDueDate(request.dueDate());
        }

        if (request.columnId() != null) {
            int targetIndex = request.orderIndex() == null ? 0 : request.orderIndex();
            applyPosition(card, request.columnId(), targetIndex);
        } else {
            repository.save(card);
        }

        log.info("Card updated id={}", id);
        return card;
    }

    public void delete(String id) {
        Card card = repository.findById(id).orElseThrow(() -> new CardNotFoundException(id));
        String columnId = card.getColumnId();
        repository.delete(card);
        reindex(repository.findByColumnIdOrderByOrderIndexAsc(columnId));
        log.info("Card deleted id={}", id);
    }

    private void applyPosition(Card card, String toColumnId, int targetIndex) {
        String fromColumnId = card.getColumnId();

        if (fromColumnId.equals(toColumnId)) {
            List<Card> siblings =
                    new ArrayList<>(
                            repository.findByColumnIdOrderByOrderIndexAsc(toColumnId).stream()
                                    .filter(c -> !c.getId().equals(card.getId()))
                                    .toList());
            int insertAt = Math.min(targetIndex, siblings.size());
            siblings.add(insertAt, card);
            reindex(siblings);
            return;
        }

        List<Card> fromSiblings =
                new ArrayList<>(
                        repository.findByColumnIdOrderByOrderIndexAsc(fromColumnId).stream()
                                .filter(c -> !c.getId().equals(card.getId()))
                                .toList());
        reindex(fromSiblings);

        List<Card> toSiblings =
                new ArrayList<>(repository.findByColumnIdOrderByOrderIndexAsc(toColumnId));
        int insertAt = Math.min(targetIndex, toSiblings.size());
        card.setColumnId(toColumnId);
        toSiblings.add(insertAt, card);
        reindex(toSiblings);
    }

    private void reindex(List<Card> ordered) {
        List<Card> dirty = new ArrayList<>();
        for (int i = 0; i < ordered.size(); i++) {
            Card c = ordered.get(i);
            if (c.getOrderIndex() == null || c.getOrderIndex() != i) {
                c.setOrderIndex(i);
                dirty.add(c);
            }
        }
        if (!dirty.isEmpty()) {
            repository.saveAll(dirty);
        }
    }
}
