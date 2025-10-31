using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<TaskService>();

// Configure CORS - Add your frontend URL here
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins(
              "http://localhost:3000",      // Create React App
              "http://localhost:5173",      // Vite
              "http://localhost:5174",      // Alternative Vite port
              "http://localhost:5175"       // Your frontend port
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");
app.UseAuthorization();
app.MapControllers();

app.Run();

// Task Model
public class TaskItem
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
}

// In-Memory Service
public class TaskService
{
    private readonly List<TaskItem> _tasks = new();
    private int _nextId = 1;

    public List<TaskItem> GetAll() => _tasks;

    public TaskItem? GetById(int id) => _tasks.FirstOrDefault(t => t.Id == id);

    public TaskItem Create(string description)
    {
        var task = new TaskItem
        {
            Id = _nextId++,
            Description = description,
            IsCompleted = false
        };
        _tasks.Add(task);
        return task;
    }

    public bool Update(int id, TaskItem updatedTask)
    {
        var task = GetById(id);
        if (task == null) return false;

        task.Description = updatedTask.Description;
        task.IsCompleted = updatedTask.IsCompleted;
        return true;
    }

    public bool Delete(int id)
    {
        var task = GetById(id);
        if (task == null) return false;
        return _tasks.Remove(task);
    }
}

// Tasks Controller
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly TaskService _taskService;

    public TasksController(TaskService taskService)
    {
        _taskService = taskService;
    }

    // GET: api/tasks
    [HttpGet]
    public ActionResult<List<TaskItem>> GetAllTasks()
    {
        return Ok(_taskService.GetAll());
    }

    // GET: api/tasks/{id}
    [HttpGet("{id}")]
    public ActionResult<TaskItem> GetTaskById(int id)
    {
        var task = _taskService.GetById(id);
        if (task == null)
            return NotFound();
        return Ok(task);
    }

    // POST: api/tasks
    [HttpPost]
    public ActionResult<TaskItem> CreateTask([FromBody] CreateTaskDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest("Description is required");

        var task = _taskService.Create(dto.Description);
        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
    }

    // PUT: api/tasks/{id}
    [HttpPut("{id}")]
    public IActionResult UpdateTask(int id, [FromBody] TaskItem task)
    {
        if (!_taskService.Update(id, task))
            return NotFound();
        return NoContent();
    }

    // DELETE: api/tasks/{id}
    [HttpDelete("{id}")]
    public IActionResult DeleteTask(int id)
    {
        if (!_taskService.Delete(id))
            return NotFound();
        return NoContent();
    }
}

// DTO for creating tasks
public class CreateTaskDto
{
    public string Description { get; set; } = string.Empty;
}