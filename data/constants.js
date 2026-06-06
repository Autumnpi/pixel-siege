const CONSTANTS = {
    WIDTH: 800,
    HEIGHT: 600,

    PLAYER_SPEED: 185,
    PLAYER_HP: 5,
    PLAYER_IFRAMES: 800,

    BULLET_SPEED: 520,
    BULLET_DAMAGE: 1,
    BULLET_COOLDOWN: 130,
    BULLET_LIFESPAN: 1400,

    // Charge meter (fills from damage dealt, fire with Q key)
    CHARGE_MIN_PCT: 20,          // minimum % to fire
    CHARGE_DAMAGE_MIN: 3,        // bullet damage at min charge
    CHARGE_DAMAGE_MAX: 15,       // bullet damage at full charge
    CHARGE_SIZE_MIN: 1.5,        // bullet scale at min charge
    CHARGE_SIZE_MAX: 4.0,        // bullet scale at full charge
    CHARGE_SPEED: 700,
    CHARGE_METER_PER_DAMAGE: 2,  // % of meter gained per damage point

    ENEMY_BULLET_SPEED: 240,
    ENEMY_BULLET_DAMAGE: 1,
    ENEMY_BULLET_LIFESPAN: 2000,

    SPAWN_MARGIN: 40,
};
