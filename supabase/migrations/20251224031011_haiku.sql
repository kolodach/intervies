INSERT INTO
    ai_pricing (
        model,
        state,
        input_price_per_token,
        output_price_per_token,
        cached_input_price_per_token
    )
VALUES
    (
        'anthropic/claude-haiku-4.5',
        'active',
        0.000001,
        0.000005,
        0.0000001
    );

INSERT INTO
    ai_pricing (
        model,
        state,
        input_price_per_token,
        output_price_per_token,
        cached_input_price_per_token
    )
VALUES
    (
        'google/gemini-3-flash',
        'active',
        0.0000005,
        0.000003,
        0.00000005
    );