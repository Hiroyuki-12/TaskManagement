package com.example.taskmanagement.card;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

import com.example.taskmanagement.common.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class CardControllerTest {

    private CardService cardService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        cardService = mock(CardService.class);
        mockMvc =
                standaloneSetup(new CardController(cardService))
                        .setControllerAdvice(new GlobalExceptionHandler())
                        .build();
    }

    @Test
    void create_returns201AndBody() throws Exception {
        when(cardService.create(any())).thenReturn(sampleCard("c1"));

        String body =
                """
                {"title":"買い物","columnId":"todo","orderIndex":0,"priority":"medium"}
                """;

        mockMvc.perform(post("/api/cards").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("c1"))
                .andExpect(jsonPath("$.title").value("買い物"));
    }

    @Test
    void create_validationError_returns400WithCommonShape() throws Exception {
        String body =
                """
                {"title":"","columnId":"todo","orderIndex":0}
                """;

        mockMvc.perform(post("/api/cards").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details").isArray());
    }

    @Test
    void update_partial_callsService() throws Exception {
        when(cardService.update(eq("c1"), any())).thenReturn(sampleCard("c1"));

        String body =
                """
                {"title":"更新後"}
                """;

        mockMvc.perform(
                        patch("/api/cards/c1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("c1"));

        verify(cardService).update(eq("c1"), any(UpdateCardRequest.class));
    }

    @Test
    void update_position_callsService() throws Exception {
        when(cardService.update(eq("c1"), any())).thenReturn(sampleCard("c1"));

        String body =
                """
                {"columnId":"doing","orderIndex":2}
                """;

        mockMvc.perform(
                        patch("/api/cards/c1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/cards/c1")).andExpect(status().isNoContent());
        verify(cardService).delete("c1");
    }

    @Test
    void notFound_returns404WithCommonShape() throws Exception {
        when(cardService.update(eq("missing"), any()))
                .thenThrow(new CardNotFoundException("missing"));

        String body =
                """
                {"title":"x"}
                """;

        mockMvc.perform(
                        patch("/api/cards/missing")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Card not found: missing"));
    }

    private Card sampleCard(String id) {
        Card c = new Card();
        c.setId(id);
        c.setTitle("買い物");
        c.setDescription("");
        c.setPriority("medium");
        c.setColumnId("todo");
        c.setOrderIndex(0);
        return c;
    }
}
