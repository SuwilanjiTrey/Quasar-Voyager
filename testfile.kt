import io.ktor.application.*
import io.ktor.html.*
import io.ktor.http.content.*
import io.ktor.routing.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import kotlinx.html.*

fun main() {
    val server = embeddedServer(Netty, port = 8080) {
        routing {
            static("/static") {
                resources("static")
            }
            get("/index") {
                call.respondHtml {
                    head {
                        title("Index Page")
                    }
                    body {
                        h1 { +"Welcome to the Index Page" }
                        p {
                            // Link to access the index.html file
                            a(href = "/static/index.html") {
                                +"Click here to view the index.html file"
                            }
                        }
                    }
                }
            }
        }
    }
    server.start(wait = true)
}

    
