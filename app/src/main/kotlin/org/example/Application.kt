package org.example

import io.ktor.application.*
import io.ktor.features.CORS
import io.ktor.features.ContentNegotiation
import io.ktor.html.respondHtml
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.PartData
import io.ktor.http.content.forEachPart
import io.ktor.http.content.resources
import io.ktor.http.content.static 
import io.ktor.request.receiveMultipart
import io.ktor.response.respondText
import io.ktor.routing.*
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import kotlinx.html.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.io.File
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.html.*
import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.request.*
import io.ktor.response.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.gson.*
import io.ktor.response.respond

import io.ktor.features.*






fun initDatabase() {
    val config = HikariConfig().apply {
        jdbcUrl = "jdbc:sqlite:data/database.db"
        driverClassName = "org.sqlite.JDBC"
        maximumPoolSize = 3
        isAutoCommit = false
        transactionIsolation = "TRANSACTION_SERIALIZABLE"
        validate()
    }
    val dataSource = HikariDataSource(config)
    Database.connect(dataSource)
    transaction {
        SchemaUtils.create(Classes)
        // Add other tables here
        SchemaUtils.create(Courses)
        SchemaUtils.create(OtherReminders)
        SchemaUtils.create(Student)
        SchemaUtils.create(Timetable)
    }
}

object Classes : Table() {
    val class_id = integer("class_id").autoIncrement()
    val course_id = integer("course_id").references(Courses.course_id)
   val class_start_time = text("class_start_time")
    val class_end_time = text("class_end_time")
    override val primaryKey = PrimaryKey(class_id)
}

object Courses : Table() {
    val course_id = integer("course_id").autoIncrement()
    override val primaryKey = PrimaryKey(course_id)
}

object Timetable : Table() {
    val entry_id = integer("entry_id").autoIncrement()
    val course_code = varchar("course_code", 255)
    val course_name = varchar("course_name", 255)
    val class_start_time = varchar("class_start_time", 5) // Format: HH:mm
    val class_end_time = varchar("class_end_time", 5) // Format: HH:mm
    val day_of_week = varchar("day_of_week", 10) // e.g., "Monday"
    override val primaryKey = PrimaryKey(entry_id)
}


object OtherReminders : Table() {
    val reminder_id = integer("reminder_id").autoIncrement()
    val reminder_name = varchar("reminder_name", 30)
    val time = text("time")
    val date = text("date").nullable()
    val isRepeat = varchar("isRepeat", 3).default("no")
    override val primaryKey = PrimaryKey(reminder_id)
}

object Student : Table() {
    val user_id = integer("user_id").autoIncrement()
    val user_fname = varchar("user_fname", 255)
    val password = text("password")
    val user_lname = varchar("user_lname", 255)
    override val primaryKey = PrimaryKey(user_id)
}



fun uploadText(part: PartData.FileItem, fileName: String) {
    val folder = File("uploads/texts")
    folder.mkdirs()
    val file = File(folder, fileName)
    file.writeBytes(part.streamProvider().readBytes())

}

fun uploadBook(part: PartData.FileItem, fileName: String) {
    val folder = File("uploads/books")
    folder.mkdirs()
    val file = File(folder, fileName)
    file.writeBytes(part.streamProvider().readBytes())

}
//@Suppress("unused") // Referenced in application.conf
fun main() {
    initDatabase()

    val server = embeddedServer(Netty, port = 8080) {
        install(CORS) {
            method(HttpMethod.Options)
            method(HttpMethod.Put)
            method(HttpMethod.Delete)
            method(HttpMethod.Patch)
            header(HttpHeaders.Authorization)
            allowCredentials = true
            anyHost()
        }

        install(ContentNegotiation) {
            gson {
                setPrettyPrinting()
            }
        }

        routing {
            static("/static") {
                resources("static")

                
            }


            get("/") {
                call.respondFile(File("src/main/resources/static/night.html"))
            }
            




            static("/uploads") {
                files("uploads")
            }

            static("/books") {
                files("uploads/books")
            }

            post("/upload") {
                val multipart = call.receiveMultipart()
                var responseMessage = ""

                multipart.forEachPart { part ->
                    if (part is PartData.FileItem) {
                        val fileName = part.originalFileName ?: "unnamed"
                        when {
                            part.contentType?.match(ContentType.Video.MP4) == true -> {
                                val folder = File("uploads/videos")
                                folder.mkdirs()
                                val file = File(folder, fileName)
                                file.writeBytes(part.streamProvider().readBytes())
                                responseMessage += "Video file uploaded successfully: $fileName\n"
                            }
                            part.contentType?.match(ContentType.Text.Plain) == true -> {
                                uploadText(part, fileName)
                                responseMessage += "Text file uploaded successfully: $fileName\n"
                            }
                            part.contentType?.match(ContentType.Application.Pdf) == true -> {
                                uploadBook(part, fileName)
                                responseMessage += "Book file uploaded successfully: $fileName\n"
                            }
                            else -> {
                                responseMessage += "Unsupported file type: $fileName\n"
                            }
                        }
                    }
                    part.dispose()
                }

                call.respondText(responseMessage, status = HttpStatusCode.OK)
            }


//database starts here
get("/studentInfo") {
    val students = transaction {
        Student.selectAll().map {
            mapOf(
                "user_id" to it[Student.user_id],
                "fname" to it[Student.user_fname],
                "lname" to it[Student.user_lname],
                "password" to it[Student.password]
            )
        }
    }
    call.respond(students)
}

post("/studentInfo") {
    val studentInfo = call.receive<Map<String, String>>()
    val fname = studentInfo["fname"]
    val lname = studentInfo["lname"]
    val password = studentInfo["password"]

    if (fname != null && lname != null && password != null) {
        val id = transaction {
            Student.insert {
                it[Student.user_fname] = fname
                it[Student.user_lname] = lname
                it[Student.password] = password
            } get Student.user_id
        }
        call.respond(mapOf("user_id" to id, "fname" to fname, "lname" to lname, "password" to password))
    } else {
        call.respond(HttpStatusCode.BadRequest, "Missing name or password")
    }
}

put("/studentInfo/{id}") {
    val id = call.parameters["id"]?.toIntOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
    val updateInfo = call.receive<Map<String, String>>()
    val newFName = updateInfo["fname"]
    val newLName = updateInfo["lname"]
    val newPassword = updateInfo["password"]

    if (newFName != null && newLName != null && newPassword != null) {
        transaction {
            Student.update({ Student.user_id eq id }) {
                it[Student.user_fname] = newFName
                it[Student.user_lname] = newLName
                it[Student.password] = newPassword
            }
        }
        call.respondText("Student updated successfully", status = HttpStatusCode.OK)
    } else {
        call.respond(HttpStatusCode.BadRequest, "Missing name or password")
    }
}

delete("/studentInfo/{id}") {
    val id = call.parameters["id"]?.toIntOrNull() ?: return@delete call.respond(HttpStatusCode.BadRequest)

    transaction {
        Student.deleteWhere { Student.user_id eq id }
    }

    call.respondText("Student deleted successfully", status = HttpStatusCode.OK)
}

// Create Timetable Entry
post("/timetable") {
    val timetableEntry = call.receive<Map<String, String>>()
    
    val course_code = timetableEntry["course_code"]
    val course_name = timetableEntry["course_name"]
    val startTime = timetableEntry["class_start_time"]
    val endTime = timetableEntry["class_end_time"]
    val dayOfWeek = timetableEntry["day_of_week"]

    if (
        course_code != null && 
        course_name != null && 
        startTime != null && endTime != null && dayOfWeek != null) {
        val entryId = transaction {
            Timetable.insert {
                it[Timetable.course_code] = course_code
                it[Timetable.course_name] = course_name
                it[Timetable.class_start_time] = startTime
                it[Timetable.class_end_time] = endTime
                it[Timetable.day_of_week] = dayOfWeek
            } get Timetable.entry_id
        }
        call.respond(mapOf(
            "entry_id" to entryId,
            "course_code" to course_code,
            "course_name" to course_name,
            "class_start_time" to startTime,
            "class_end_time" to endTime,
            "day_of_week" to dayOfWeek
        ))
    } else {
        call.respond(HttpStatusCode.BadRequest, "Missing timetable entry data")
    }
}
get("/today") {
    val dayOfWeek = call.request.queryParameters["day_of_week"]
    if (dayOfWeek != null) {
        val courses = transaction {
            Timetable.select { Timetable.day_of_week eq dayOfWeek }
                .map {
                    mapOf(
                        "course_code" to it[Timetable.course_code],
                        "class_start_time" to it[Timetable.class_start_time],
                        "class_end_time" to it[Timetable.class_end_time]
                    )
                }
        }
        call.respond(courses)
    } else {
        call.respond(HttpStatusCode.BadRequest, "Missing day_of_week parameter")
    }
}



// Read Timetable Entries
get("/timetable") {
    val entries = transaction {
        Timetable.selectAll().map {
            mapOf(
                "entry_id" to it[Timetable.entry_id],
                
               "course_code" to it[Timetable.course_code],
               "course_name" to it[Timetable.course_name],
                "class_start_time" to it[Timetable.class_start_time],
                "class_end_time" to it[Timetable.class_end_time],
                "day_of_week" to it[Timetable.day_of_week]
            )
        }
    }
    call.respond(entries)





}


// Update Timetable Entry
put("/timetable/{id}") {
    val id = call.parameters["id"]?.toIntOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
    val updateInfo = call.receive<Map<String, String>>()
    
    val course_code = updateInfo["course_code"]
    val course_name = updateInfo["course_name"]
    val startTime = updateInfo["class_start_time"]
    val endTime = updateInfo["class_end_time"]
    val dayOfWeek = updateInfo["day_of_week"]

    if (
    course_code != null && 
    course_name != null && 
    startTime != null && endTime != null && dayOfWeek != null) {
        transaction {
            Timetable.update({ Timetable.entry_id eq id }) {
                
                it[Timetable.course_code] = course_code
                it[Timetable.course_name] = course_name
                it[Timetable.class_start_time] = startTime
                it[Timetable.class_end_time] = endTime
                it[Timetable.day_of_week] = dayOfWeek
            }
        }
        call.respondText("Timetable entry updated successfully", status = HttpStatusCode.OK)
    } else {
        call.respond(HttpStatusCode.BadRequest, "Missing timetable entry data")
    }
}


// Delete Timetable Entry
delete("/timetable/{id}") {
    val id = call.parameters["id"]?.toIntOrNull() ?: return@delete call.respond(HttpStatusCode.BadRequest)

    transaction {
        Timetable.deleteWhere { Timetable.entry_id eq id }
    }

    call.respondText("Timetable entry deleted successfully", status = HttpStatusCode.OK)
}




















get("/time") {
    call.respondFile(File("src/main/resources/static/timetable.html"))
}

get("/schedule"){
    call.respondFile(File("src/main/resources/static/studyindex.html"))
    
}


// Serve the index.html file
get("/database") {
    call.respondFile(File("src/main/resources/static/database.html"))
}


//database ends here











            
// Delete a video by filename
            delete("/uploads/videos/{fileName}") {
                val filename = call.parameters["fileName"]
                if (filename == null) {
                    call.respond(HttpStatusCode.BadRequest, "Invalid file name")
                    return@delete
                }

                val file = File("uploads/videos", filename)
                if (file.exists() && file.delete()) {
                    call.respondText("Video deleted successfully", status = HttpStatusCode.OK)
                } else {
                    call.respondText("Failed to delete video or video not found", status = HttpStatusCode.NotFound)
                }
            }












        }
    }
    server.start(wait = true)
}