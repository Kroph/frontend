package com.diploma.Diplom.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.Map;

@Schema(description = "Profile update. Avatar is updated via POST /profile/me/avatar")
public record UpdateProfileRequest(

    @Schema(description = "Display name")
    @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
    String name,

    @Schema(description = "Age")
    @Min(value = 1,  message = "Age must be at least 1")
    @Max(value = 120, message = "Age must be at most 120")
    Integer age,

    @Schema(description = "Short bio / introduction")
    @Size(max = 500, message = "Bio must be at most 500 characters")
    String bio,

    @Schema(description = "Social media links keyed by platform, e.g. twitter, linkedin, github")
    Map<String, String> socialLinks
) {}