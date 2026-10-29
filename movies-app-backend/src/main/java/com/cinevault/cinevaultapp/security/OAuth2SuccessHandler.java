package com.cinevault.cinevaultapp.security;

import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.repository.IUserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Called by Spring Security immediately after a successful Google OAuth2 login.
 *
 * <p>On every successful login it:</p>
 * <ol>
 *   <li>The user record will be created or updated.</li>
 *   <li>Issues a JWT via the existing method.</li>
 *   <li>Writes it into the same HttpOnly cookie the rest of the app uses.</li>
 *   <li>Redirects the browser back to the frontend callback route with clean URL and user metadata.</li>
 * </ol>
 *
 * @author karthicknathan
 * @since Oct 26, 2026
 */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final IUserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${frontend.url}")
    private String frontendUrl;

    /**
     * Constructor for {@link OAuth2SuccessHandler}.
     */
    public OAuth2SuccessHandler(IUserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    /**
     * The Spring Security calls this once Google confirms the user's identity.
     *
     * @param request        The original login request.
     * @param response       The response where the cookie and redirect will be applied.
     * @param authentication Spring's auth object, the principal is a Google OAuth2User.
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        String email = oauth2User.getAttribute("email");
        String firstName = oauth2User.getAttribute("given_name");
        String lastName = oauth2User.getAttribute("family_name");
        String avatar = oauth2User.getAttribute("picture");
        String userName = email != null ? email.substring(0, email.indexOf("@")) : firstName;

        UserEntity user = userRepository.findByUserName(userName)
                .orElseGet(() -> {
                    UserEntity newUser = new UserEntity();
                    newUser.setUserName(userName);
                    newUser.setPassword("");
                    return newUser;
                });

        user.setFirstName(firstName != null ? firstName : "");
        user.setLastName(lastName != null ? lastName : "");
        user.setAvatarUrl(avatar);
        user = userRepository.save(user);

        // Issue the app JWT and set it in a HttpOnly cookie.
        String token = jwtUtil.generateToken(userName);
        boolean secure = request.isSecure() || "https".equalsIgnoreCase(
                request.getHeader("X-Forwarded-Proto"));
        response.addHeader(HttpHeaders.SET_COOKIE, jwtUtil.createAuthCookie(token, secure));

        // Remove any trailing slash from frontendUrl to prevent duplicate slashes like //login/callback.
        String redirectBase = frontendUrl.replaceAll("/+$", "");
        String fullName = firstName + " " + lastName;

        String targetUrl = redirectBase + "/login/callback?status=success"
                + "&username=" + URLEncoder.encode(userName, StandardCharsets.UTF_8)
                + "&fullName=" + URLEncoder.encode(fullName, StandardCharsets.UTF_8);

        // Send the browser back to frontend.
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
