using System;
using System.Reflection;
using System.Linq;

class Program
{
    static void Main()
    {
        var asm = typeof(Microsoft.OpenApi.OpenApiSecurityScheme).Assembly;
        Console.WriteLine("Types in Microsoft.OpenApi:");
        foreach (var t in asm.GetTypes().Where(t => t.Name.Contains("Reference") || t.Name.Contains("Security")))
        {
            Console.WriteLine(t.FullName);
        }

        Console.WriteLine("\nProperties of OpenApiSecurityScheme:");
        foreach (var p in typeof(Microsoft.OpenApi.OpenApiSecurityScheme).GetProperties())
        {
            Console.WriteLine(p.Name + " : " + p.PropertyType.Name);
        }
    }
}
