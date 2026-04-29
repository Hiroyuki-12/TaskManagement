package com.example.taskmanagement.card;

/** 指定 ID のカードが存在しない場合にスローされる。HTTP 応答は GlobalExceptionHandler が行う。 */
public class CardNotFoundException extends RuntimeException {
    public CardNotFoundException(String id) {
        super("Card not found: " + id);
    }
}
